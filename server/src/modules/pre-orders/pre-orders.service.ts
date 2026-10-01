import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PreOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsRepository } from '../products/products.repository';
import { canBePreOrdered, toPricingDto } from '../products/product.mapper';
import { PreOrdersRepository, HistoryEntry } from './pre-orders.repository';
import { toPreOrderDto, PreOrderDto } from './pre-order.mapper';
import { PRE_ORDER_STATUS_TO_DB, canTransition } from './pre-order.enums';
import { unitPriceWithOptions, estimateTotal } from './pre-order-pricing.util';
import { CreatePreOrderDto } from './dto/create-pre-order.dto';
import { isProfileComplete } from '../../common/mappers/user.mapper';
import { Errors, ErrorDetail } from '../../common/exceptions/app.exception';
import { PaginatedResult, clampPagination, resolveOvershootPage } from '../../common/dto/paginated-result';
import { PreOrderQueryDto, AdminPreOrderQueryDto } from './dto/pre-order-query.dto';
import { PRE_ORDER_STATUSES } from './pre-order.enums';

interface ResolvedItem {
  id: string;
  productId: string;
  productSlug: string;
  productTitle: unknown;
  productImageUrl: string | null;
  quantity: number;
  selectedOptions: {
    optionId: string;
    valueId: string;
    optionName: unknown;
    valueLabel: unknown;
    priceDelta: number;
  }[];
  unitPrice: ReturnType<typeof toPricingDto>;
}

@Injectable()
export class PreOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PreOrdersRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async create(userId: string, dto: CreatePreOrderDto): Promise<PreOrderDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!isProfileComplete(user)) {
      throw Errors.profileIncomplete();
    }

    const errors: ErrorDetail[] = [];
    const resolvedItems: ResolvedItem[] = [];

    for (const [index, itemDto] of dto.items.entries()) {
      const product = await this.productsRepository.findAdminById(itemDto.productId);
      if (!product || !canBePreOrdered(product)) {
        throw Errors.productNotPreorderable(`items.${index}.productId`);
      }

      if (itemDto.quantity < product.preOrderMinQuantity || itemDto.quantity > product.preOrderMaxQuantity) {
        errors.push({
          field: `items.${index}.quantity`,
          code: 'out_of_range',
          message: `quantity must be between ${product.preOrderMinQuantity} and ${product.preOrderMaxQuantity}`,
        });
      }

      const selection = itemDto.options ?? {};
      const validOptionIds = new Set(product.options.map((option) => option.id));
      const missing: ErrorDetail[] = [];
      const invalid: ErrorDetail[] = [];

      for (const option of product.options) {
        const valueId = selection[option.id];
        if (option.required && !valueId) {
          missing.push({
            field: `items.${index}.options.${option.id}`,
            code: 'required',
            message: 'This option is required',
          });
        } else if (valueId && !option.values.some((value) => value.id === valueId)) {
          invalid.push({
            field: `items.${index}.options.${option.id}`,
            code: 'invalid',
            message: 'Unknown option value',
          });
        }
      }
      for (const key of Object.keys(selection)) {
        if (!validOptionIds.has(key)) {
          invalid.push({ field: `items.${index}.options.${key}`, code: 'invalid', message: 'Unknown option' });
        }
      }
      errors.push(...missing, ...invalid);

      const selectedOptions: ResolvedItem['selectedOptions'] = [];
      let totalDelta = 0;
      for (const option of product.options) {
        const valueId = selection[option.id];
        if (!valueId) continue;
        const value = option.values.find((v) => v.id === valueId);
        if (!value) continue;
        selectedOptions.push({
          optionId: option.id,
          valueId: value.id,
          optionName: option.name,
          valueLabel: value.label,
          priceDelta: value.priceDelta,
        });
        totalDelta += value.priceDelta;
      }

      const sortedImages = product.images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
      resolvedItems.push({
        id: `poi_${randomUUID()}`,
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        productImageUrl: sortedImages[0]?.url ?? null,
        quantity: itemDto.quantity,
        selectedOptions,
        unitPrice: unitPriceWithOptions(toPricingDto(product), totalDelta),
      });
    }

    if (errors.length > 0) {
      throw Errors.validation(errors);
    }

    const total = estimateTotal(resolvedItems);
    const address = user.addressPostalCode
      ? { city: user.addressCity, line: user.addressLine, postalCode: user.addressPostalCode }
      : { city: user.addressCity, line: user.addressLine };

    const history: HistoryEntry[] = [
      { status: 'pending', changedAt: new Date().toISOString(), changedBy: 'customer', note: null },
    ];

    const created = await this.repository.create({
      userId,
      customerSnapshot: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address,
      },
      items: resolvedItems,
      estimatedTotalMin: total?.min ?? null,
      estimatedTotalMax: total?.max ?? null,
      customerNote: dto.customerNote ?? null,
      history,
    });

    return toPreOrderDto(created, false);
  }

  async listMine(userId: string, query: PreOrderQueryDto): Promise<PaginatedResult<PreOrderDto>> {
    const { page, pageSize, skip } = clampPagination(query, 10);
    const status = query.status && PRE_ORDER_STATUSES.includes(query.status)
      ? PRE_ORDER_STATUS_TO_DB[query.status]
      : undefined;

    const { items, total } = await this.repository.findMine(userId, status, skip, pageSize);
    const correctedPage = resolveOvershootPage(page, pageSize, total);
    if (correctedPage !== page && total > 0) {
      const retry = await this.repository.findMine(userId, status, (correctedPage - 1) * pageSize, pageSize);
      return new PaginatedResult(retry.items.map((item) => toPreOrderDto(item, false)), correctedPage, pageSize, retry.total);
    }
    return new PaginatedResult(items.map((item) => toPreOrderDto(item, false)), page, pageSize, total);
  }

  async getMine(userId: string, id: string): Promise<PreOrderDto> {
    const preOrder = await this.repository.findMineById(id, userId);
    if (!preOrder) throw Errors.notFound('Pre-order not found');
    return toPreOrderDto(preOrder, false);
  }

  async cancelMine(userId: string, id: string, reason?: string): Promise<PreOrderDto> {
    const preOrder = await this.repository.findMineById(id, userId);
    if (!preOrder) throw Errors.notFound('Pre-order not found');
    if (preOrder.status !== PreOrderStatus.PENDING) {
      throw Errors.invalidStatusTransition('Only pending pre-orders can be cancelled');
    }

    const updated = await this.repository.appendHistoryAndSetStatus(id, PreOrderStatus.CANCELLED, {
      status: 'cancelled',
      changedAt: new Date().toISOString(),
      changedBy: 'customer',
      note: reason ?? null,
    });
    return toPreOrderDto(updated, false);
  }

  async listAdmin(query: AdminPreOrderQueryDto): Promise<PaginatedResult<PreOrderDto>> {
    const { page, pageSize, skip } = clampPagination(query, 20);
    const status = query.status && PRE_ORDER_STATUSES.includes(query.status)
      ? PRE_ORDER_STATUS_TO_DB[query.status]
      : undefined;

    const { items, total } = await this.repository.adminSearch({
      status,
      q: query.q?.trim() || undefined,
      productId: query.productId,
      skip,
      take: pageSize,
    });
    const correctedPage = resolveOvershootPage(page, pageSize, total);
    if (correctedPage !== page && total > 0) {
      const retry = await this.repository.adminSearch({
        status,
        q: query.q?.trim() || undefined,
        productId: query.productId,
        skip: (correctedPage - 1) * pageSize,
        take: pageSize,
      });
      return new PaginatedResult(retry.items.map((item) => toPreOrderDto(item, true)), correctedPage, pageSize, retry.total);
    }
    return new PaginatedResult(items.map((item) => toPreOrderDto(item, true)), page, pageSize, total);
  }

  async getAdmin(id: string): Promise<PreOrderDto> {
    const preOrder = await this.repository.findAdminById(id);
    if (!preOrder) throw Errors.notFound('Pre-order not found');
    return toPreOrderDto(preOrder, true);
  }

  async updateStatus(id: string, status: string, note?: string): Promise<PreOrderDto> {
    const preOrder = await this.repository.findAdminById(id);
    if (!preOrder) throw Errors.notFound('Pre-order not found');

    const targetStatus = PRE_ORDER_STATUS_TO_DB[status];
    if (!canTransition(preOrder.status, targetStatus)) {
      throw Errors.invalidStatusTransition(`Cannot transition from ${preOrder.status} to ${status}`);
    }

    const updated = await this.repository.appendHistoryAndSetStatus(id, targetStatus, {
      status,
      changedAt: new Date().toISOString(),
      changedBy: 'admin',
      note: note ?? null,
    });
    return toPreOrderDto(updated, true);
  }

  async updateNote(id: string, adminNote: string | null | undefined): Promise<PreOrderDto> {
    const preOrder = await this.repository.findAdminById(id);
    if (!preOrder) throw Errors.notFound('Pre-order not found');

    const updated = await this.repository.updateAdminNote(id, adminNote ?? null);
    return toPreOrderDto(updated, true);
  }
}

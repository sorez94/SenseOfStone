import { Injectable } from '@nestjs/common';
import { PreOrderStatus, ProductStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toPreOrderDto } from '../pre-orders/pre-order.mapper';

const PRODUCT_STATUSES: ProductStatus[] = [ProductStatus.DRAFT, ProductStatus.PUBLISHED, ProductStatus.ARCHIVED];
const PRE_ORDER_STATUSES: PreOrderStatus[] = [
  PreOrderStatus.PENDING,
  PreOrderStatus.CONFIRMED,
  PreOrderStatus.REJECTED,
  PreOrderStatus.CANCELLED,
  PreOrderStatus.COMPLETED,
];

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      productsByStatus,
      categoriesTotal,
      preOrdersByStatus,
      customersTotal,
      recentPreOrders,
    ] = await Promise.all([
      Promise.all(
        PRODUCT_STATUSES.map(async (status) => [
          status,
          await this.prisma.product.count({ where: { status, deletedAt: null } }),
        ] as const),
      ),
      this.prisma.category.count({ where: { deletedAt: null } }),
      Promise.all(
        PRE_ORDER_STATUSES.map(async (status) => [
          status,
          await this.prisma.preOrder.count({ where: { status } }),
        ] as const),
      ),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.preOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    const productsTotal = productsByStatus.reduce((sum, [, count]) => sum + count, 0);
    const preOrdersTotal = preOrdersByStatus.reduce((sum, [, count]) => sum + count, 0);

    return {
      products: {
        total: productsTotal,
        byStatus: {
          draft: productsByStatus.find(([s]) => s === ProductStatus.DRAFT)?.[1] ?? 0,
          published: productsByStatus.find(([s]) => s === ProductStatus.PUBLISHED)?.[1] ?? 0,
          archived: productsByStatus.find(([s]) => s === ProductStatus.ARCHIVED)?.[1] ?? 0,
        },
      },
      categories: { total: categoriesTotal },
      preOrders: {
        total: preOrdersTotal,
        byStatus: {
          pending: preOrdersByStatus.find(([s]) => s === PreOrderStatus.PENDING)?.[1] ?? 0,
          confirmed: preOrdersByStatus.find(([s]) => s === PreOrderStatus.CONFIRMED)?.[1] ?? 0,
          rejected: preOrdersByStatus.find(([s]) => s === PreOrderStatus.REJECTED)?.[1] ?? 0,
          cancelled: preOrdersByStatus.find(([s]) => s === PreOrderStatus.CANCELLED)?.[1] ?? 0,
          completed: preOrdersByStatus.find(([s]) => s === PreOrderStatus.COMPLETED)?.[1] ?? 0,
        },
      },
      customers: { total: customersTotal },
      recentPreOrders: recentPreOrders.map((preOrder) => toPreOrderDto(preOrder, true)),
    };
  }
}

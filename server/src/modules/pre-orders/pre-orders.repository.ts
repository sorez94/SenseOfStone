import { Injectable } from '@nestjs/common';
import { Prisma, PreOrder, PreOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface HistoryEntry {
  status: string;
  changedAt: string;
  changedBy: 'customer' | 'admin' | 'system';
  note: string | null;
}

export interface CreatePreOrderData {
  userId: string;
  customerSnapshot: unknown;
  items: unknown;
  estimatedTotalMin: number | null;
  estimatedTotalMax: number | null;
  customerNote: string | null;
  history: HistoryEntry[];
}

function reorderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}

@Injectable()
export class PreOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Generates the "PO-<year>-<5-digit sequence>" reference and inserts the row atomically. */
  async create(data: CreatePreOrderData): Promise<PreOrder> {
    return this.prisma.$transaction(async (tx) => {
      const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>(
        Prisma.sql`SELECT nextval('pre_order_reference_seq') as nextval`,
      );
      const year = new Date().getUTCFullYear();
      const reference = `PO-${year}-${String(nextval).padStart(5, '0')}`;

      return tx.preOrder.create({
        data: {
          reference,
          userId: data.userId,
          customerSnapshot: data.customerSnapshot as Prisma.InputJsonValue,
          items: data.items as Prisma.InputJsonValue,
          estimatedTotalMin: data.estimatedTotalMin,
          estimatedTotalMax: data.estimatedTotalMax,
          customerNote: data.customerNote,
          history: data.history as unknown as Prisma.InputJsonValue,
        },
      });
    });
  }

  findMineById(id: string, userId: string): Promise<PreOrder | null> {
    return this.prisma.preOrder.findFirst({ where: { id, userId } });
  }

  findAdminById(id: string): Promise<PreOrder | null> {
    return this.prisma.preOrder.findUnique({ where: { id } });
  }

  async findMine(
    userId: string,
    status: PreOrderStatus | undefined,
    skip: number,
    take: number,
  ): Promise<{ items: PreOrder[]; total: number }> {
    const where: Prisma.PreOrderWhereInput = { userId, ...(status ? { status } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.preOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.preOrder.count({ where }),
    ]);
    return { items, total };
  }

  async adminSearch(filters: {
    status?: PreOrderStatus;
    q?: string;
    productId?: string;
    skip: number;
    take: number;
  }): Promise<{ items: PreOrder[]; total: number }> {
    const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];

    if (filters.status) {
      conditions.push(Prisma.sql`po."status"::text = ${filters.status}`);
    }
    if (filters.q) {
      const pattern = `%${filters.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      conditions.push(Prisma.sql`(
        po."reference" ILIKE ${pattern} ESCAPE '\\' OR
        po."customerSnapshot"->>'email' ILIKE ${pattern} ESCAPE '\\' OR
        po."customerSnapshot"->>'firstName' ILIKE ${pattern} ESCAPE '\\' OR
        po."customerSnapshot"->>'lastName' ILIKE ${pattern} ESCAPE '\\' OR
        po."customerSnapshot"->>'phone' ILIKE ${pattern} ESCAPE '\\'
      )`);
    }
    if (filters.productId) {
      conditions.push(
        Prisma.sql`jsonb_path_exists(po."items", '$[*] ? (@.productId == $pid)', jsonb_build_object('pid', ${filters.productId}::text))`,
      );
    }

    const where = Prisma.join(conditions, ' AND ');

    const totalRows = await this.prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*) as count FROM "PreOrder" po WHERE ${where}`,
    );
    const total = Number(totalRows[0]?.count ?? 0);

    const idRows = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT po."id" FROM "PreOrder" po WHERE ${where} ORDER BY po."createdAt" DESC LIMIT ${filters.take} OFFSET ${filters.skip}`,
    );
    const ids = idRows.map((row) => row.id);
    if (ids.length === 0) return { items: [], total };

    const items = await this.prisma.preOrder.findMany({ where: { id: { in: ids } } });
    return { items: reorderByIds(items, ids), total };
  }

  /**
   * Read-modify-write (not row-locked): acceptable for this app's scale - the status-machine
   * check still prevents an invalid double-transition, the only narrow risk under true
   * concurrent admin edits is a lost `history` entry, not a wrong final `status`.
   */
  async appendHistoryAndSetStatus(
    id: string,
    status: PreOrderStatus,
    entry: HistoryEntry,
  ): Promise<PreOrder> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.preOrder.findUniqueOrThrow({ where: { id } });
      const history = [...(existing.history as unknown as HistoryEntry[]), entry];
      return tx.preOrder.update({
        where: { id },
        data: { status, history: history as unknown as Prisma.InputJsonValue },
      });
    });
  }

  async updateAdminNote(id: string, adminNote: string | null): Promise<PreOrder> {
    return this.prisma.preOrder.update({ where: { id }, data: { adminNote } });
  }
}

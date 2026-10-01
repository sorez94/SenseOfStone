import { preOrderStatuses, productStatuses, type DashboardStats } from "@/domain";
import { ok } from "../http";
import type { RouteDefinition } from "../router";
import { toPublicUser } from "./shared";

const countBy = <K extends string>(keys: readonly K[], values: K[]) =>
  Object.fromEntries(keys.map((key) => [key, values.filter((v) => v === key).length])) as Record<K, number>;

export const adminRoutes: RouteDefinition[] = [
  ["GET", "/admin/me", ({ auth }) => ok(toPublicUser(auth.requireAdmin()))],
  [
    "GET",
    "/admin/dashboard",
    ({ db, auth }) => {
      auth.requireAdmin();
      const stats: DashboardStats = {
        products: { total: db.products.length, byStatus: countBy(productStatuses, db.products.map((p) => p.status)) },
        categories: { total: db.categories.length },
        preOrders: { total: db.preOrders.length, byStatus: countBy(preOrderStatuses, db.preOrders.map((p) => p.status)) },
        customers: { total: db.users.filter((u) => u.role === "customer").length },
        recentPreOrders: [...db.preOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      };
      return ok(stats);
    },
  ],
];

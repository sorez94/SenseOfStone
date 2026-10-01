import { useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { PreOrderStatus } from "@/domain";

const tones: Record<PreOrderStatus, BadgeTone> = {
  pending: "amber",
  confirmed: "blue",
  completed: "green",
  rejected: "red",
  cancelled: "neutral",
};

export function PreOrderStatusBadge({ status }: { status: PreOrderStatus }) {
  const t = useTranslations("preOrderStatus");
  return <Badge tone={tones[status]}>{t(status)}</Badge>;
}

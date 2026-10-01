import { useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { AvailabilityStatus } from "@/domain";

const availabilityTone: Record<AvailabilityStatus, BadgeTone> = {
  in_stock: "green",
  made_to_order: "sage",
  out_of_stock: "amber",
  discontinued: "neutral",
};

export function AvailabilityBadge({ availability }: { availability: AvailabilityStatus }) {
  const t = useTranslations("availability");
  return <Badge tone={availabilityTone[availability]}>{t(availability)}</Badge>;
}

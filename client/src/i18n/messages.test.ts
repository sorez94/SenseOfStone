import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";

function keys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

function placeholders(value: string): string[] {
  // `{name}` or `{name, plural, …}` — not plural branch text such as `{No products}`.
  return [...value.matchAll(/\{(\w+)(?=[,}])/g)].map((m) => m[1]!).sort();
}

describe("translations", () => {
  it("Persian has exactly the same keys as English", () => {
    expect(keys(fa).sort()).toEqual(keys(en).sort());
  });

  it("uses the same ICU placeholders in both languages", () => {
    const get = (obj: unknown, path: string) => path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj);
    for (const key of keys(en)) {
      const enValue = get(en, key) as string;
      const faValue = get(fa, key) as string;
      expect(placeholders(faValue).filter((p) => p !== "count"), key).toEqual(placeholders(enValue).filter((p) => p !== "count"));
      expect(faValue.trim().length, key).toBeGreaterThan(0);
    }
  });
});

import type messages from "../../messages/en.json";
import type { Locale } from "./config";

/** Makes translation keys type-checked: a missing/misspelled key is a compile error. */
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}

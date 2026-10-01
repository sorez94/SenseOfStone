"use client";

import { createContext, useContext } from "react";
import type { Services } from "@/services";

export const ServicesContext = createContext<Services | null>(null);

/** Access API services from Client Components. Tests can provide fakes via ServicesContext. */
export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("useServices must be used inside <AppProviders>");
  return services;
}

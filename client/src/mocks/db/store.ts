import { createSeedDatabase } from "./seed";
import type { MockDatabase } from "./types";

/**
 * In-memory database for the fake backend. Stored on `globalThis` so every
 * module instance in the Next.js server process (route handlers, server
 * components, dev hot reloads) shares the same state. Data resets on restart.
 */
const globalKey = Symbol.for("new-sos.mock-db");
type GlobalWithDb = typeof globalThis & { [globalKey]?: MockDatabase };

export function getDb(): MockDatabase {
  const g = globalThis as GlobalWithDb;
  g[globalKey] ??= createSeedDatabase();
  return g[globalKey];
}

export function resetDb(): MockDatabase {
  const g = globalThis as GlobalWithDb;
  g[globalKey] = createSeedDatabase();
  return g[globalKey];
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function now(): string {
  return new Date().toISOString();
}

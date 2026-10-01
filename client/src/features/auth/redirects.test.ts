import { describe, expect, it } from "vitest";
import { resolvePostAuthPath, safeNextPath, withNext } from "./redirects";

describe("safeNextPath", () => {
  it("accepts relative paths and rejects external or malformed ones", () => {
    expect(safeNextPath("/products/luna?x=1")).toBe("/products/luna?x=1");
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("https://evil.com")).toBeNull();
    expect(safeNextPath("/\\evil.com")).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
  });
});

describe("resolvePostAuthPath", () => {
  it("sends incomplete profiles to profile completion, keeping the destination", () => {
    expect(resolvePostAuthPath({ isProfileComplete: false, role: "customer" }, "/products/a/pre-order")).toBe(
      "/complete-profile?next=%2Fproducts%2Fa%2Fpre-order",
    );
  });

  it("honours next, otherwise defaults by role", () => {
    expect(resolvePostAuthPath({ isProfileComplete: true, role: "customer" }, "/account")).toBe("/account");
    expect(resolvePostAuthPath({ isProfileComplete: true, role: "customer" }, null)).toBe("/");
    expect(resolvePostAuthPath({ isProfileComplete: true, role: "admin" }, "//x")).toBe("/admin");
  });

  it("builds next query strings", () => {
    expect(withNext("/login", "/account")).toBe("/login?next=%2Faccount");
    expect(withNext("/login", "http://x")).toBe("/login");
  });
});

import { describe, expect, it } from "vitest";

import { getSafeNextPath } from "./redirects";

describe("getSafeNextPath", () => {
  it("keeps a local application path", () => {
    expect(getSafeNextPath("/app?tab=profile")).toBe("/app?tab=profile");
  });

  it.each([
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "app",
    "",
  ])("rejects unsafe redirect candidate %j", (candidate) => {
    expect(getSafeNextPath(candidate)).toBe("/app");
  });
});

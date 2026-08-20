import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("Nomadio web app manifest", () => {
  it("uses the Nomadio PNG app icon", () => {
    expect(manifest().icons).toEqual([
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ]);
  });
});

import { describe, expect, it } from "vitest";

import { getProfileViewModel, getSafeGoogleAvatarUrl } from "./profile";

describe("profile presentation", () => {
  it("prefers synchronized profile data and derives initials", () => {
    const profile = getProfileViewModel(
      {
        avatar_url: "https://lh3.googleusercontent.com/avatar",
        created_at: "2026-08-04T00:00:00Z",
        default_currency: "EUR",
        display_name: "Ada Lovelace",
        email: "ada@example.com",
        id: "user-id",
        locale: "en-GB",
        quick_expense_fab_enabled: true,
        timezone: "Europe/London",
        updated_at: "2026-08-04T00:00:00Z",
      },
      { email: "fallback@example.com" },
    );

    expect(profile).toMatchObject({
      avatarUrl: "https://lh3.googleusercontent.com/avatar",
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      initials: "AL",
    });
  });

  it("rejects non-Google and non-HTTPS avatar URLs", () => {
    expect(getSafeGoogleAvatarUrl("https://example.com/avatar.png")).toBeNull();
    expect(
      getSafeGoogleAvatarUrl("http://lh3.googleusercontent.com/avatar"),
    ).toBeNull();
  });
});

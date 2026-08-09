import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/actions", () => ({ signInWithGoogle: vi.fn() }));

import LoginPage from "./page";

describe("LoginPage", () => {
  it("renders the premium entry point and Google CTA", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ next: "/app/trips" }) }));
    expect(screen.getByRole("heading", { name: /Vše pro vaše cesty\.\s*Na jednom místě\./ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pokračovat přes Google" })).toBeInTheDocument();
  });

  it("presents a safe inline OAuth error without technical details", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ error: "oauth" }) }));
    expect(screen.getByRole("alert")).toHaveTextContent("Přihlášení se nepodařilo.");
    expect(screen.getByRole("alert")).toHaveTextContent("Zkuste to prosím znovu.");
  });
});

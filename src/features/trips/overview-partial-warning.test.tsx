import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { OverviewPartialWarning } from "./overview-partial-warning";

describe("Trip overview partial warning", () => {
  it("keeps technical details hidden and offers an accessible retry", () => {
    render(<OverviewPartialWarning />);
    expect(screen.getByRole("status")).toHaveTextContent("Některé údaje se nepodařilo načíst.");
    expect(screen.getByRole("status")).not.toHaveTextContent("PostgreSQL");
    fireEvent.click(screen.getByRole("button", { name: "Zkusit znovu" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

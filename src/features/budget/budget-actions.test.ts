import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMock, eqMock, getUserMock, insertMock, redirectMock, revalidatePathMock, updateMock } = vi.hoisted(() => ({
  deleteMock: vi.fn(), eqMock: vi.fn(), getUserMock: vi.fn(), insertMock: vi.fn(),
  redirectMock: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }), revalidatePathMock: vi.fn(), updateMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({
  auth: { getUser: getUserMock },
  from: vi.fn(() => ({ delete: deleteMock, insert: insertMock, update: updateMock })),
})) }));

import { createBudgetItem, deleteBudgetItem, updateBudgetItem } from "./budget-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const itemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function form() {
  const data = new FormData();
  data.set("tripId", tripId); data.set("itemId", itemId); data.set("name", "Pojištění"); data.set("category", "travel_services");
  data.set("estimatedAmount", "1000"); data.set("actualAmount", "900"); data.set("paidAmount", "900"); data.set("currency", "CZK"); data.set("paymentStatus", "paid");
  data.set("subcategory", "insurance");
  return data;
}

describe("budget actions", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "user" } } });
    insertMock.mockReset().mockResolvedValue({ error: null });
    eqMock.mockReset().mockResolvedValue({ error: null });
    updateMock.mockReset().mockReturnValue({ eq: eqMock });
    deleteMock.mockReset().mockReturnValue({ eq: eqMock });
    eqMock.mockImplementation(() => ({ eq: eqMock, error: null }));
    redirectMock.mockClear(); revalidatePathMock.mockReset();
  });

  it("creates only a manual budget item", async () => {
    const data = form(); data.delete("itemId");
    await expect(createBudgetItem(data)).rejects.toThrow("budget=created");
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ actual_amount: 900, source_id: null, source_type: "manual", subcategory: "insurance", trip_id: tripId }));
  });

  it("updates a manual item", async () => {
    await expect(updateBudgetItem(form())).rejects.toThrow("budget=updated");
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ category: "travel_services", payment_status: "paid", subcategory: "insurance" }));
  });

  it("deletes a manual item", async () => {
    await expect(deleteBudgetItem(form())).rejects.toThrow("budget=removed");
    expect(deleteMock).toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMock, eqMock, getUserMock, insertMock, redirectMock, revalidatePathMock, updateMock } = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  eqMock: vi.fn(),
  getUserMock: vi.fn(),
  insertMock: vi.fn(),
  redirectMock: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
  revalidatePathMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({
  auth: { getUser: getUserMock },
  from: vi.fn(() => ({ delete: deleteMock, insert: insertMock, update: updateMock })),
})) }));

import { createBudgetPlanItem, deleteBudgetPlanItem, updateBudgetPlanItem } from "./budget-plan-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const itemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function form() {
  const data = new FormData();
  data.set("tripId", tripId);
  data.set("itemId", itemId);
  data.set("category", "transport");
  data.set("subcategory", "flights");
  data.set("name", "Letenky");
  data.set("plannedAmount", "25000");
  data.set("currency", "CZK");
  return data;
}

describe("budget plan actions", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "user" } } });
    insertMock.mockReset().mockResolvedValue({ error: null });
    eqMock.mockReset().mockImplementation(() => ({ eq: eqMock, error: null }));
    updateMock.mockReset().mockReturnValue({ eq: eqMock });
    deleteMock.mockReset().mockReturnValue({ eq: eqMock });
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
  });

  it("creates a plan item with authenticated ownership and trip scope", async () => {
    const data = form();
    data.delete("itemId");
    await expect(createBudgetPlanItem(data)).rejects.toThrow("budget=plan-created");
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      category: "transport",
      created_by: "user",
      planned_amount: 25000,
      subcategory: "flights",
      trip_id: tripId,
    }));
  });

  it("updates only the selected trip plan item", async () => {
    await expect(updateBudgetPlanItem(form())).rejects.toThrow("budget=plan-updated");
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ name: "Letenky", planned_amount: 25000 }));
    expect(eqMock).toHaveBeenCalledWith("id", itemId);
    expect(eqMock).toHaveBeenCalledWith("trip_id", tripId);
  });

  it("deletes only the selected trip plan item", async () => {
    await expect(deleteBudgetPlanItem(form())).rejects.toThrow("budget=plan-removed");
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("trip_id", tripId);
  });

  it("rejects an invalid category and amount before database access", async () => {
    const invalidCategory = form();
    invalidCategory.set("category", "invalid");
    await expect(createBudgetPlanItem(invalidCategory)).rejects.toThrow("budget=plan-invalid");

    const invalidAmount = form();
    invalidAmount.set("plannedAmount", "-1");
    await expect(updateBudgetPlanItem(invalidAmount)).rejects.toThrow("budget=plan-invalid");
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMock, eqMock, expenseInsertMock, getUserMock, maybeSingleMock, redirectMock, revalidatePathMock, selectMock, updateMock } = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  eqMock: vi.fn(),
  expenseInsertMock: vi.fn(),
  getUserMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  redirectMock: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
  revalidatePathMock: vi.fn(),
  selectMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({
  auth: { getUser: getUserMock },
  from: vi.fn((table: string) => table === "trips"
    ? { select: selectMock }
    : { delete: deleteMock, insert: expenseInsertMock, update: updateMock }),
})) }));

import { createExpense, deleteExpense, updateExpense } from "./budget-expense-actions";

afterEach(() => vi.useRealTimers());

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const itemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function form() {
  const data = new FormData();
  data.set("tripId", tripId);
  data.set("itemId", itemId);
  data.set("amount", "450");
  data.set("category", "food");
  data.set("subcategory", "restaurants");
  data.set("title", "Večeře");
  return data;
}

describe("expense actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-01T12:34:56Z"));
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "user" } } });
    maybeSingleMock.mockReset().mockResolvedValue({ data: { currency: "CZK" }, error: null });
    selectMock.mockReset().mockReturnValue({ eq: vi.fn(() => ({ maybeSingle: maybeSingleMock })) });
    expenseInsertMock.mockReset().mockResolvedValue({ error: null });
    eqMock.mockReset().mockImplementation(() => ({ eq: eqMock, error: null }));
    updateMock.mockReset().mockReturnValue({ eq: eqMock });
    deleteMock.mockReset().mockReturnValue({ eq: eqMock });
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
  });

  it("creates a quick expense with server time, trip currency and authenticated owner", async () => {
    const data = form();
    data.delete("itemId");
    await expect(createExpense(data)).rejects.toThrow("budget=expense-created");
    expect(expenseInsertMock).toHaveBeenCalledWith(expect.objectContaining({
      amount: 450,
      created_by: "user",
      currency: "CZK",
      occurred_at: "2027-06-01T12:34:56.000Z",
      trip_id: tripId,
    }));
  });

  it("updates and deletes a trip-scoped expense", async () => {
    await expect(updateExpense(form())).rejects.toThrow("budget=expense-updated");
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ amount: 450, title: "Večeře" }));
    expect(eqMock).toHaveBeenCalledWith("trip_id", tripId);

    await expect(deleteExpense(form())).rejects.toThrow("budget=expense-removed");
    expect(deleteMock).toHaveBeenCalled();
  });

  it("rejects an invalid category and amount", async () => {
    const invalidCategory = form();
    invalidCategory.set("category", "invalid");
    await expect(createExpense(invalidCategory)).rejects.toThrow("budget=expense-invalid");

    const invalidAmount = form();
    invalidAmount.set("amount", "0");
    await expect(updateExpense(invalidAmount)).rejects.toThrow("budget=expense-invalid");
    expect(expenseInsertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});

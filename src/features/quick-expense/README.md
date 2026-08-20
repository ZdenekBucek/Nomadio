# Global Quick Expense

The optional Quick Expense FAB is stored per user as `profiles.quick_expense_fab_enabled` and defaults to off. The authenticated AppShell renders it only when the preference is enabled and at least one non-archived trip is active for the current date in that trip's IANA timezone, with an owner/editor membership.

The FAB reuses the Budget Reality `BudgetExpenseForm`, validation, categories and `createExpense` action. A single active trip is selected automatically; multiple active editable trips use a compact selector. Viewers, archived trips and foreign trips remain protected by the existing RLS policies.

This phase does not add an offline queue or background sync. Saving still requires the server connection.

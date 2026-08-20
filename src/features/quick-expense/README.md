# Global Quick Expense

The optional Quick Expense FAB is stored per user as `profiles.quick_expense_fab_enabled` and defaults to off. This remains the master switch. The authenticated AppShell renders the FAB only when the preference is enabled and at least one non-archived owner/editor trip is either active in its IANA timezone or is still in the future with `trips.quick_expense_before_start_enabled` explicitly enabled.

The trip preference applies only before `start_date`; it never makes an ended trip eligible. The FAB reuses the Budget Reality `BudgetExpenseForm`, validation, categories and `createExpense` action. A single eligible trip is selected automatically; multiple eligible trips use a compact selector. A pre-trip Quick Expense remains a normal Reality expense and uses today's date in the selected trip timezone, not the trip start date. Viewers, archived trips and foreign trips remain protected by the existing RLS policies.

This phase does not add an offline queue or background sync. Saving still requires the server connection.

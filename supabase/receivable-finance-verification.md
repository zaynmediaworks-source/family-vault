# Receivable–Finance integration

Each receivable owns one Expense through `expenses.receivable_id` (unique foreign key). Each payment owns one Income through `income.receivable_payment_id` (unique foreign key); its receivable is reachable through the payment. Foreign keys cascade deletions. Database triggers synchronize amount, name, date, notes and archive state in the same transaction. Existing receivables were backfilled using their original dates.

Finance entries managed by Piutang must be changed through Piutang; direct changes are rejected with an Indonesian explanation. Other Finance entries retain their existing behavior. Income uses the source prefix and tag `Pembayaran Piutang`; Expense uses category/tag `Piutang Diberikan`.

The modal retains a UUID across retries and uses conflict-ignore inserts. A synchronous submission lock prevents double clicks. Payment validation locks the receivable row and rejects overpayment. The existing RLS policies remain unchanged. Private definer triggers explicitly check the current user's household membership, preserve Finance authorship on updates, have a fixed empty search path and cannot be invoked as public RPCs.

## Verification performed

- `supabase/test-receivable-finance.sql`: passed under the authenticated role. Covers add, retry, installment, amount/date/name/note edits, overpayment rejection, direct Finance mutation rejection, archive/restore, settlement, cascading deletes, and Income/Expense totals returning to baseline. Test writes roll back.
- Separate transaction tests: outsiders cannot read Finance/Piutang or insert cross-household receivables/payments; another approved household member can edit a receivable while preserving the original Finance creator. All fixture writes roll back.
- Production Next.js build: passed.
- TypeScript check scoped to the three changed components and their dependencies: passed (explicit node/react/react-dom types).
- Full repository TypeScript check remains blocked by pre-existing syntax errors in unused `WealthExperience.tsx` and `WealthExperienceV2.tsx`, line 26. The existing Next.js configuration skips type validation; this setting was not changed.
- Supabase security advisor reported no findings for the new private trigger functions. Existing public RPC and password-protection warnings remain outside this change.

The UI change adds payment editing and refresh events for both Finance views and dashboard totals. Investment, debt and other feature code is unchanged.

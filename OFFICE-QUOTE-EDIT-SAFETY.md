# Office — Unsaved Quote Safety and Concurrent Editing

The project Internal Estimate now guards unsaved edits throughout The Office.

## Behavior
- Staff editing one-time, monthly, external, or quantity fields see a persistent unsaved count and **Save estimate changes** / **Discard edits**.
- **Discard edits** requires confirmation. It reloads saved values, preserving manual accordion state and the current scroll position.
- Changing sections or projects, signing out, or refreshing/closing the browser asks for confirmation if a quote has unsaved changes.
- Project delivery statuses, requirement notes, selected scope and build prompt generation are blocked while a quote has unsaved pricing edits. Complete the save/discard first.
- A single component's **Save quoted fees** uses the same optimistic-concurrency RPC as the multi-item Save button. If other components have unsaved values, individual Save is blocked and staff are directed to **Save estimate changes**.
- Invalid values block batch Save, label the affected component and identify that displayed totals are provisional.
- Copy is disabled until quotes are saved. No client is automatically billed or emailed.

## Consistency and concurrency
The existing `ag_save_component_quote_batch` function checks each component belongs to the selected project, validates amounts and quantities, compares each row's `updated_at` to prevent overwriting a teammate's later quote, then updates all changes atomically. Benchmark snapshots are immutable.

## Verification
- JavaScript syntax validated for Office and component modules.
- Mocked input events: modifying $1,000 to $1,250 made Save available and activated the dirty guard; empty/invalid setup input blocked Save and displayed a provisional-total warning.
- Existing previous transaction tests for the batch RPC verified two-row save, stale request rejection, invalid payload rollback, and staff-only access.
- Real signed-in owner browser, navigation and mobile QA remains outstanding.

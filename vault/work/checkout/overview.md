---
scope: work
type: module
source: verified
updated: 2026-01-15
private: true
---

# Checkout (example module, invented)

- Payment provider calls go through one adapter; tests use an in-memory fake. *(verified: `src/payments/adapter.ts`)*
- Decision 2026-01-10: retries are idempotent via an order key. Reason: duplicate charges in incident review.

## Open questions
- Should refunds live here or in a separate `billing` module?

# SIDE:II Pre-Launch Security Review

Status: internal hardening complete; external provider/auth settings remain.

## Closed before launch

- Admin `SECURITY DEFINER` RPCs are not executable by `anon` / `PUBLIC`; admin authorization is checked with `app_metadata.role=admin`.
- Legacy commerce RPCs (v1-v3) are closed to storefront roles; v4 is the supported commerce path.
- Account-scoped `get_my_*` / `save_my_*` RPCs require an authenticated user.
- Internal trigger/event functions are not directly executable by `anon` or authenticated clients.
- Public catalogue/archive RLS exposes only intended catalogue states.
- RLS auth expressions use init-plan-safe `(select auth.uid())` / `(select auth.jwt())` patterns.
- Duplicate permissive SELECT policies were consolidated.
- Missing foreign-key supporting indexes were added.
- Production HTTP security headers are configured in `next.config.mjs`.

## Advisor warnings intentionally retained

### RLS enabled with no policy
Several operational tables intentionally have RLS enabled without direct client policies. They are accessed through guarded RPCs and/or have direct grants removed. Examples include admin, audit, discount, gift-card ledger, impact, cost, royalty and operational tables.

Do not add broad RLS policies merely to silence this INFO advisory.

### Public SECURITY DEFINER RPCs
The remaining anonymous `SECURITY DEFINER` warnings correspond to intentionally public storefront capabilities, such as:
- public catalogue, artist, credits, collections and press-kit reads;
- localization and shipping-scope reads;
- cart quote and guest order creation;
- gift-card availability check;
- guest waitlist / wholesale submission;
- public passport / verified-impact token views.

Any new public RPC must be reviewed for minimum data exposure and must not expose privileged mutation.

## External auth setting

Supabase Auth currently reports leaked-password protection as not enabled. Enable compromised-password protection in Supabase Auth settings before public account launch if the project plan/support allows it.

## Current performance advisor

Pre-launch fixes reduced:
- unindexed foreign keys: 22 -> 0
- auth RLS init-plan warnings: 34 -> 0
- multiple permissive policy warnings: 7 -> 0

Remaining unused-index notices are informational and should be evaluated after real production workload, not removed pre-emptively.

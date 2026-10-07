# SIDE:II Production Provider Setup

This file is the handoff checklist for the provider-dependent launch phase.

## Already implemented

- Supabase production connection through `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Resend-compatible order email endpoint at `/api/orders/notify`.
- Resend-compatible production-application endpoint at `/api/applications/notify`.
- Resend-compatible authenticated waitlist notification endpoint at `/api/waitlist/notify`.
- Store localization supports EN/TR.
- Display currencies support TRY plus configured FX rows. Checkout settlement remains TRY.

## Environment variables to configure

Required for current production email flows:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `SIDEII_ORDER_FROM`
- `SIDEII_APPLICATION_FROM`
- `SIDEII_APPLICATION_TO`

The sender addresses must use a verified production email domain before launch.

## Domain cutover

1. Add the production domain to Vercel.
2. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS domain.
3. Verify redirect/canonical behaviour.
4. Rebuild production.
5. Verify `/robots.txt` and `/sitemap.xml`.
6. Verify Supabase Auth redirect URLs against the production domain.

## Payment provider

The provider-neutral payment boundary is implemented, but a real payment provider is not connected yet.

Already implemented:

- signed HMAC-SHA256 webhook ingress at `/api/payments/webhook`;
- raw-body verification through `PAYMENT_WEBHOOK_SECRET`;
- server-only Supabase access through `SUPABASE_SECRET_KEY`;
- payment event ledger with provider/event idempotency;
- amount and currency verification against the order;
- duplicate-event conflict detection;
- payment success transition only from verified server events;
- refund/store-value/passport/impact finalization hooks;
- refund inventory release/return finalization;
- unpaid stock reservation expiry and anti-reservation-abuse limits;
- no client-side trust of payment success.

Required server variables:

- `PAYMENT_PROVIDER`
- `PAYMENT_SECRET_KEY`
- `PAYMENT_WEBHOOK_SECRET`
- `SUPABASE_SECRET_KEY`

Still provider-specific:

- payment-session / payment-intent creation;
- mapping the chosen provider's native webhook format/signature to the normalized SIDE:II webhook contract;
- provider-side refund initiation/reconciliation;
- live sandbox and production credential QA.

Never expose payment or Supabase secret keys through `NEXT_PUBLIC_*` variables.

## Shipping / carrier

Live carrier integration is not connected yet.

The store already contains shipping classes and shipping-zone logic. Production integration still needs:

- carrier account / API credentials;
- live rate adapter or an approved fixed-rate production configuration;
- shipment/tracking update path;
- carrier error fallback.

## FX

Current non-TRY values are QA/manual display rates. Production still needs either:

- a live FX provider and scheduled refresh, or
- an explicit operational process for manually maintained display-only rates.

Settlement must remain TRY unless the commerce model is intentionally changed.

## Impact transfer

The internal impact ledger, batches, verification proof and public receipts are implemented. External bank/beneficiary transfer automation is not connected and can remain manual unless a supported provider is selected.

## Final provider QA

Run after the real domain and all chosen providers are connected:

1. order received email;
2. payment success webhook;
3. payment failure;
4. duplicate webhook idempotency;
5. refund and store-value recovery;
6. physical, digital and mixed orders;
7. shipping rate / shipment update;
8. waitlist restock email;
9. application notification email;
10. live FX display;
11. sitemap/canonical/robots;
12. final QA fixture cleanup.

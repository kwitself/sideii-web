# SIDE:II — Commerce Expansion Audit

Updated after repository + Supabase verification.

## Status

| # | Module | Status | Verified implementation |
|---|---|---|---|
| 1 | Drop / release launch | DONE | Product launch rules, countdown, early access, collector early-access override, customer quantity limits, launch subscriptions and notification runner. |
| 2 | Abandoned cart recovery | DONE | Saved recovery token, restore page, admin runner, explicit email opt-in, token ownership hardening, unsubscribe flow and max two reminders. |
| 3 | Order tracking portal | PARTIAL | Public order-number + checkout-email lookup and tracking UI are live. Still a candidate for provider/server rate limiting before high-volume launch. |
| 4 | Build-your-own bundle | DONE | Flexible bundle rules, storefront builder and server-authoritative quote discount calculation. |
| 5 | Collector loyalty | DONE | Collector tiers, spend/order qualification, early access and monthly reward claim. |
| 6 | Product passport | DONE | Edition numbering, automatic passport issuance only after paid state, public verification token and refund revocation. |
| 7 | Reservation UX | DONE | 15-minute server reservation, stale release and customer countdown. |
| 8 | Shareable cart / wishlist | DONE | Authenticated share creation, canonical public payload, expiring tokens, account list management and revoke controls. |
| 9 | Gift experience | DONE | Gift checkout, recipient email, scheduled reveal, hide prices, gift wrap, private portal, QR and lifecycle notifications. |
| 10 | Commerce feeds | DONE | Google XML, Meta/Instagram CSV, Pinterest CSV and admin feed-channel controls. |
| 11 | Conversion analytics | DONE | Product view, wishlist, share, add-to-bag, checkout, order-created and verified paid-order events with admin funnel. |
| 12 | UTM attribution | DONE | Source / medium / campaign / content and referral context carried onto the order after token-authorized checkout. |
| 13 | Referral / artist codes | PARTIAL | Referral codes, order attribution and paid-order commission calculation are live. Cash payout settlement remains intentionally out of scope until company/payment operations are active. |
| 14 | Post-purchase upsell | DONE | Paid-order-only eligible offers, guest/account authorization and scoped single-use discount claim. |
| 15 | Fraud / abuse controls | PARTIAL | High-value and order-velocity review flags plus existing checkout/reservation abuse controls. Provider-side fraud signals/rate limiting come with integrated payments. |

## Launch blockers

1. Production payment path: iyzico Link mappings or later integrated iyzico credentials.
2. Company/domain/legal production details.
3. Production transactional email sender/domain configuration.
4. Carrier integration if automatic carrier status is required; manual carrier/tracking already works.
5. Final end-to-end production QA after the above are configured.

## Security notes

- Customer totals, stock, discounts, bundle savings and payment state remain server authoritative.
- Paid revenue events, passports and referral commission are generated from verified payment-state transitions.
- Gift and guest order access use scoped unguessable tokens.
- Recovery email is opt-in and includes unsubscribe; token updates are ownership-bound when associated with an account.
- Shared lists expose only normalized product fields and can be revoked by their owner.
- RPC-only tables intentionally keep RLS enabled without blanket policies; public SECURITY DEFINER RPCs are treated as explicit APIs and must validate tokens/inputs.
- Do not mark provider-dependent payment/refund/payout behavior complete until it is tested against the real provider.

# SIDE:II — Commerce Expansion

Status: approved roadmap, NOT implemented.

1. Drop launch: scheduling, early access, customer limits, waitlist.
2. Abandoned checkout: consent-based 1h/24h recovery, unsubscribe, signed links.
3. Order tracking: owner authentication or expiring scoped guest token.
4. Build-your-own bundle: backend pricing, stock and discount enforcement.
5. Collector loyalty: levels, owned editions, early access and admin rules.
6. Product passport: paid numbered editions, QR, privacy-safe verification.
7. Reservation UX: backend expiry and accurate countdown.
8. Shareable cart/wishlist: revocable links without personal data.
9. Gift experience: scheduling, cards, QR, gift-card protections.
10. Meta/Instagram/Pinterest/Google feed admin and validation.
11. Conversion funnel: consent-aware events and paid revenue only.
12. UTM attribution: privacy-aware first/last touch to paid order.
13. Artist referral: codes, anti-abuse, refund-aware commission ledger.
14. Post-purchase upsell: separate authorized payment and stock checks.
15. Fraud controls: rate limits, velocity review and safe admin flags.

Delivery: database + RLS, RPC/API, customer UI, admin controls, automated tests for each feature. Preserve existing hover renderer, Share Studio, mobile and order state machine. No live payment, refund, payout or paid-revenue claim without verified iyzico onboarding. Mark features complete only with verified test evidence.

# SIDE:II Pre-Launch Status

Updated after the full internal pre-launch pass.

## Internal launch gates

- [x] Public route smoke test
- [x] Catalogue / Store / Cart QA
- [x] Promo / automatic campaign / bundle / gift-card QA
- [x] Physical / digital / mixed checkout QA
- [x] Account and address RPC QA
- [x] Edition Passport / owner-content / collection QA
- [x] Impact allocation / verification / receipt QA
- [x] Admin Control Room functional QA
- [x] Admin Control Room full UI polish
- [x] Keyboard/dialog accessibility polish for bag, account and order modal
- [x] Responsive CSS pass
- [x] robots.txt
- [x] sitemap.xml
- [x] deploy-aware metadata base
- [x] HTTP security headers
- [x] Admin RPC hardening
- [x] Legacy commerce RPC closure
- [x] Internal trigger-function execution restriction
- [x] RLS performance optimization
- [x] RLS policy consolidation
- [x] Foreign-key index coverage
- [x] Production migration snapshots committed under `db/applied/`
- [x] Runtime-error scan clean
- [x] Launch Readiness panel in Control Room
- [x] Provider handoff documentation
- [x] No TODO/FIXME/localhost/debug placeholder sweep findings

## Internal caveats

- A dependency lockfile is not yet committed. Direct dependency versions are exact-pinned, and Vercel production builds are passing, but a lockfile should be generated and committed when npm registry access is available.
- Automated real-browser pixel/screenshot regression remains limited by browser-binary availability in the current execution environment. Responsive/accessibility/code-level checks and live route checks are complete.

## External launch gates

These require real credentials, provider choices or production-domain details:

- [ ] Add canonical production domain
- [ ] Set `NEXT_PUBLIC_SITE_URL`
- [ ] Verify canonical redirects and final sitemap host
- [ ] Add production Supabase Auth redirect URLs
- [ ] Enable Supabase leaked-password protection if available
- [ ] Verify Resend sender domain
- [ ] Configure `RESEND_API_KEY`, `SIDEII_ORDER_FROM`, `SIDEII_APPLICATION_FROM`
- [ ] Configure production application inbox
- [ ] Choose/configure payment provider
- [ ] Implement/verify signed payment webhook and refund reconciliation
- [ ] Configure carrier integration or approve fixed-rate production shipping
- [ ] Configure live FX provider or approve a documented manual display-rate process
- [ ] Run provider end-to-end QA

## Final cleanup after provider QA

Do not delete QA fixtures before provider QA.

After all provider tests pass, remove/reset:
- QA products and variants
- QA orders
- QA promo/campaign records
- QA gift cards
- QA impact data
- QA collections / bundle
- QA wholesale fixture
- QA press assets/content
- `qa-test` FX rates
- temporary QA audit/test records

Then run one final smoke/security/runtime check before launch.

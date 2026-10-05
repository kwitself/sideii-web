# SIDE:II Product Roadmap

## Guiding rule
Build the label, catalogue, commerce, collector and impact systems first. Anything that depends on a final legal company identity, production domain, verified sending domain, live payment provider, banking credentials, or carrier contracts stays in the final launch phase.

## Phase 01 — Collector Core ✅
- Release Passport / Edition Certificate
- Customer collection view
- QR-ready passport URLs for physical inserts
- Numbered edition ownership
- Owner-only release content foundation

## Phase 02 — Catalogue Depth ✅
- Archive / Sold Out Museum
- Repress / second pressing generations
- Catalogue timeline
- Artist pages
- Credits graph
- Listening preview
- Digital booklet reader

## Phase 03 — Commerce Expansion ✅
- Product bundles / collector sets
- Gift mode
- Store credit / gift cards
- Drop system: CORE / DROP 01 / ARTIST OBJECTS / ARCHIVE
- Pre-order production milestones
- Low-stock editorial messaging

## Phase 04 — Collector Experience ✅
- Collector profile
- Owned editions count
- Wishlist + owned + archive relationship
- Secret owner-only content
- QR entry points from physical products

## Phase 05 — Impact ✅
- Impact Ledger
- Customer Impact Receipt / Donation Proof
- Public anonymous impact page
- Customer impact history
- Verified proof links
- Automatic email delivery hook

## Phase 06 — Operations Intelligence ✅
- Production cost & margin panel
- Artist / royalty share ledger
- Smart admin alerts
- Restock demand meter
- Daily Control Room brief
- Audit log
- Stock-location readiness

## Phase 07 — B2B / Scale ✅
- Wholesale / distributor portal
- Bulk order rules
- Warehouse / consignment locations
- Press / media kit

## Phase 07.5 — Localization / Currency — core complete
- English + Turkish storefront language foundation
- Global language selector
- Display currency selector
- TRY base pricing with converted display currencies
- Manual FX rate management in Control Room
- Live FX provider sync deferred to final launch/provider phase

## Phase 08 — Final Launch Dependencies
Deferred until legal/company/domain/provider information is final:
- legal company name / address / tax data
- verified production domain + canonical URLs
- verified mail sender + Resend/provider
- live payment provider + webhooks
- live refund flow
- banking / automated donation transfer
- DHL / live international carrier rates
- production analytics / consent setup
- final legal text review
- final sitemap / robots / canonical domain pass

## Final QA
- desktop / tablet / mobile
- SIDE:II / Lethargia / Wear
- store / account / checkout / admin
- release passport / owner content
- impact ledger / proof
- performance / accessibility / SEO
- production deploy checklist


## Current implementation status
Completed or active foundations:
- edition passports, collection profile, owner-only content
- archive museum, repress metadata, artist pages, structured credits
- listening preview, digital booklet fields
- bundles with backend discount calculation
- gift mode
- drops / collections
- preorder milestone public UI
- impact ledger, verified public impact, customer impact receipt
- production cost / margin foundation
- royalty share rules and report
- smart alerts, daily brief and audit log
- wholesale applications and wholesale price-rule foundation
- store credit and gift-card ledger foundation
- Control Room sections through 14 / FULFILLMENT + MEDIA
- stock reconciliation health
- press/media kit with direct asset upload
- gift-card/store-credit checkout redemption and account history
- language / display currency foundation

Remaining before Final QA:
- full functional + visual regression check
- mobile / tablet / desktop review
- production readiness report

Code hygiene pass: ✅ complete
- legacy StoreClient checkout removed
- GlobalBag is the single storefront cart/checkout authority
- obsolete v2 commerce calls removed from storefront code
- metadata title duplication normalized
- launch readiness checklist added

Provider-dependent actions remain deferred to Phase 08.

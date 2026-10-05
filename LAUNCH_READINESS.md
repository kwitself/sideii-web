# SIDE:II Launch Readiness

## Product systems complete before final QA
- catalogue / releases / imprints
- store / merch / bundles / drops
- preorder / limited numbering / digital delivery
- account / wishlist / saved addresses / collector profile
- edition passports / owner-only content
- impact ledger / verified public impact / customer receipts
- archive / timeline / artists / credits
- gift mode / gift cards / store credit
- wholesale foundation
- stock locations / consignment readiness
- press / media kits
- localization and display-currency foundation
- admin audit / alerts / cost / margin / royalty / value operations

## Deferred until company + domain phase
Do not hard-code or fabricate any of the following before they are real:
- legal company name
- registered address
- tax office / tax number
- production domain
- verified sender domain
- payment provider merchant credentials
- bank / charity transfer credentials
- carrier contract credentials
- live FX provider credentials

## Final provider integrations
1. production domain + canonical base URL
2. verified transactional email provider
3. live payment provider + webhook verification
4. refund webhook and reconciliation
5. live international carrier / DHL rate source
6. live FX-rate source
7. donation transfer connector if a supported payout API is selected
8. analytics / consent configuration

## Final QA gates
- production build succeeds
- no legacy commerce RPC calls remain in storefront code
- desktop / tablet / mobile visual review
- account / checkout / gift card / store credit
- physical / digital / mixed / preorder orders
- bundle discount validation
- numbered edition passport issuance
- refund / cancellation recovery
- impact allocation / batch / receipt
- stock reservation / shipment / location reconciliation
- EN / TR switching and display currencies
- archive / artists / credits / timeline / press kit
- admin permissions and audit log
- accessibility keyboard / focus pass
- metadata / robots / sitemap / canonical pass after domain is known

## Launch rule
The site is not considered production-ready until every Final QA gate passes after the real domain and provider credentials are connected.

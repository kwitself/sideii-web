# SIDE:II QA Test Matrix

This repository is currently seeded with a clean QA-only commerce dataset. All catalogue records use QA catalogue numbers and test-only names.

## Core fixtures

| Fixture | Purpose |
| --- | --- |
| QA-001 / QA Core Release | Active release with vinyl, numbered CD and digital download |
| QA-002 / QA Preorder Cassette | Sold-out cassette with preorder enabled and production milestone |
| QA-003 / QA Lethargia Edition | Lethargia imprint, low-stock physical edition |
| QA-M01 / QA Support Tee | Merch variants S/M/L, including a sold-out size, impact rule |
| QA-M02 / QA Support Mug | Merch object and bundle/collection coverage |
| QA-ARCH-01 / QA Archive Release | Archived and not-for-sale behaviour |
| QA-FUT-01 / QA Forthcoming Release | Coming-soon behaviour |
| QA-SEL-01 / QA Selected Distribution | Distributed / selected release behaviour |

## Checkout fixtures

- Promo code: **QA10** → 10% discount.
- Automatic campaign: **QA 2+ Items / 5%** → activates at 2+ eligible items.
- Gift card: **QA500** → TRY 500 available.
- Gift card: **QA250** → TRY 250 available.
- Expired gift card: **QAEXPIRED** → must be rejected.
- Currency test rates are active for USD, EUR and GBP with source 'qa-test'.
- Checkout settlement must remain TRY.

## Store / catalogue QA

1. Open Store and confirm all active QA products appear once.
2. Filter SIDE:II, Lethargia, Selected and each media type.
3. QA-001:
   - vinyl can be added to bag;
   - CD displays limited-edition numbering;
   - digital is treated as download / no shipping.
4. QA-002:
   - cassette shows preorder state;
   - production milestone shows target 10;
   - preorder can enter checkout despite physical stock 0.
5. QA-003:
   - Lethargia styling appears;
   - low-stock state is visible/admin-alertable.
6. QA-M01:
   - S and M are available;
   - L is sold out and exposes waitlist.
7. QA-ARCH-01:
   - appears in Archive;
   - release page can be viewed;
   - cannot be purchased.
8. QA-FUT-01:
   - visible as forthcoming;
   - purchase action disabled.
9. QA-SEL-01:
   - shows original/distribution attribution.

## Cart / checkout QA

1. Add one physical item; confirm standard shipping.
2. Add vinyl; confirm vinyl shipping class behaviour.
3. Add merch; confirm merch shipping class behaviour.
4. Add physical + digital; confirm MIXED order.
5. Add only digital; confirm no physical shipping requirement.
6. Add two eligible items; confirm automatic QA 5% campaign.
7. Apply **QA10**; confirm promo calculation and summary.
8. Add products forming **QA Collector Set**; confirm backend bundle discount.
9. Enable Gift Mode:
   - gift message;
   - hide-prices flag.
10. Apply **QA500** and **QA250** separately.
11. Apply **QAEXPIRED** and confirm rejection.
12. Logged-in account with store credit: enable store-credit use and confirm checkout reduction.
13. Confirm order creation never collects real payment in QA.

## Account / collector QA

After a QA order is changed to PAID in Control Room:
- order appears in Order History;
- gift-card/store-credit amounts appear when used;
- QA-001 numbered CD creates an Edition Passport;
- My Collection increments;
- Catalogue Completion updates;
- QA-001 owner-only content unlocks;
- digital QA-001 download link becomes available;
- paid numbered edition passport opens through its public token.

## Impact QA

QA Support Tee is linked to **QA Wear Support** at 10%.

1. Pay an order containing QA-M01.
2. Confirm one impact allocation is created exactly once.
3. Create an Impact Batch.
4. Mark transfer sent, add a test proof URL, then verify.
5. Confirm allocation becomes DONATED.
6. Confirm public Impact totals update.
7. Confirm the customer Impact Receipt route works only after verified donation proof.

Do not describe the contribution as a personal tax-deductible donation by the customer.

## Collections / bundle QA

Public collections:
- QA Core
- QA Drop 01
- QA Artist Objects

Bundle:
- QA Collector Set / 10%

Confirm public collection pages, bundle contents and Store links.

## Credits / artist / archive / timeline QA

- **Ada Test** has credits across more than one QA release for cross-catalogue credit navigation.
- Artist pages should group QA Artist, Nocturne QA, Archive QA, Future QA and Guest QA correctly.
- Timeline includes current and archived public releases.
- Archive contains QA-ARCH-01.
- QA-001 exposes public Press / Media Kit.

## Admin QA

Control Room:
- 09 / Impact
- 10 / Catalogue Ops
- 11 / Growth Ops
- 12 / Value Ops
- 13 / Localization
- 14 / Fulfillment + Media

Verify:
- product costs and estimated margin;
- owner-only content;
- credits and royalty rules;
- wholesale applicant **qa-wholesale@example.com**;
- wholesale price rules;
- gift-card issuance;
- preorder target/deadline editing;
- FX rate activation;
- stock locations QA Warehouse / QA Studio / QA Consignment;
- stock-health ALIGNED / UNASSIGNED states;
- press kit copy/assets;
- audit feed after product/order changes.

## Localization QA

- EN and TR can be switched without page reload.
- preference survives refresh.
- TRY, USD, EUR and GBP can be selected.
- all non-TRY rates are QA-only manual display rates.
- converted prices are display-only.
- actual order pricing/settlement remains TRY until the live payment/FX phase.

## Before production/domain launch

Remove all QA fixtures and reset:
- QA products / variants;
- QA orders;
- QA promo/campaign/gift cards;
- QA impact data;
- QA collections/bundles;
- QA wholesale application;
- QA press assets/content;
- 'qa-test' FX rates.

Then configure the final company, domain, live mail, payment provider, bank/donation transfer, carrier rates and live FX source.

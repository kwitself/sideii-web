# SIDE:II admin audit — 18 October 2026

Base: `a947c2413b74c2e0ca38c0c84d0baca36a66e141` (`main`).
Work branch: `audit/admin-quality-20261018`.
Final save-flow follow-up: 19 October 2026.

## Scope and boundaries

This change follows the supplied technical work order and 18 admin screenshots. It preserves the Next.js/Supabase architecture and the existing monochrome visual identity. Storefront screenshots are expected separately; this change includes storefront regression checks, not a new storefront design.

The connected production database was inspected read-only. No real order, charge, refund, financial entry, email, catalogue deletion or database migration was executed. Browser fixtures exist only inside the test harness and cannot reach a real Supabase or payment provider. The branch is intended for review before a production merge/deployment.

## Implemented changes

| Problem | Change | Main files |
| --- | --- | --- |
| Cached auth events could race with verified user data; ordinary authenticated users could mount the admin UI | Verify the user with the auth server, require the trusted application role, ignore cached initial-session roles, and handle sign-in/out failures | `AdminGate.js`, `adminSafety.js` |
| Storefront account/cart effects ran inside admin and could sync a saved cart | Unmount the storefront account and cart implementations on admin routes | `GlobalBag.js`, `GlobalAccount.js` |
| Publication checked the old draft status; empty/inactive/digital variants could appear ready | Shared readiness checks validate the requested status, positive prices, active variants, duplicate SKUs, availability and delivery files | `productQa.js`, product editors |
| A release could become public before its variants were saved | Keep the product hidden during variant persistence, publish only after all writes succeed, and retain a recoverable hidden record on failure | `EditReleaseModal.js`, `ReleaseWorkspace.js` |
| QA fixtures could be published or deleted through some admin actions | Detect QA catalogue numbers, slugs and SKUs; block publication/deletion; keep new QA releases draft-only | `adminSafety.js`, `AdminDashboard.js`, editors |
| Failed initial creation could be submitted again | Remember the created draft and offer a return to the product list; disable duplicate creation | `ReleaseWorkspace.js` |
| Editing stock overwrote order reservations and could silently overwrite newer stock | Preserve reservations, require non-negative integers and stock at least equal to reservations, skip zero-quantity ledger entries, and condition updates on the originally read stock/reservations | `adminSafety.js`, `AdminDashboard.js`, both editors |
| Save controls became available before completion; restock notification HTTP failures were ignored | Keep controls busy through follow-up requests, report failed notification requests, and avoid claiming a successfully published product is hidden if a later refresh fails | `AdminDashboard.js`, `EditReleaseModal.js`, `MerchWorkspace.js`, `ReleaseWorkspace.js` |
| Digital stock distorted physical inventory totals | Separate digital and inactive editions from active physical-stock totals | `adminSafety.js`, `AdminDashboard.js` |
| Finance failures appeared as zero balances; estimates mixed currencies | Fail visibly with retry, exclude QA/non-TRY orders from order estimates, and disclose the 1,000-order scope | `FinanceAccountingPanel.js`, `AdminAnalyticsPanel.js` |
| Analytics hid losses and labelled a trailing year as YTD | Preserve negative estimates, label 365 days accurately, and state the chart's actual 30-day visual window | `AdminAnalyticsPanel.js` |
| Customers had only a count; order/customer counts reflected a short sample | Render customer records, use exact counts and load-more pagination, and label overview metrics as loaded-order totals | `AdminDashboard.js` |
| Shipping class-rate failures were ignored | Surface partial-save errors and restore busy state after exceptions | `AdminDashboard.js` |
| Modal Escape/focus behaviour and mobile controls were inconsistent | Shared focus trap, Escape and focus restoration; closed navigation is inert; dialogs sit above the mobile header | `useAdminDialog.js`, `AdminRail.js`, editors |
| Inventory/growth spacing, very small text, hidden mobile status controls and floating session controls | Shared neutral refinement stylesheet; shorter sections, readable controls, bounded audit feed, visible mobile status and direct action buttons | `admin-refinement.css` |
| Admin eagerly imported many workspaces | Split the admin workspace imports with Next.js dynamic imports | `AdminDashboard.js` |
| Gallery preview URLs and digital uploads could be associated with stale editor positions | Clean preview URLs, retain external gallery URLs, give unsaved variants stable keys, and avoid deleting old images before a successful save | `EditReleaseModal.js`, `MerchWorkspace.js` |

## Verification

Run locally with an isolated Supabase placeholder URL and publishable test key; never set production credentials for the browser harness.

```sh
npm ci
npm run qa
node --test tests/*.test.mjs
npm audit --omit=dev
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sideii_test_only npm run build
npm start
# In the same local environment, after the server is ready:
npm run qa:http
node scripts/check-browser-smoke.mjs
node scripts/check-admin-browser.mjs
```

The browser scripts require Playwright/Chromium. CI installs the pinned existing runner `playwright@1.56.1`; a local Chromium executable can be supplied with `SIDEII_CHROMIUM_PATH`. `SIDEII_QA_WIDTHS` can narrow an admin diagnostic run; its default is all eight requested widths.

Evidence from this work:

- 64 Node regression tests passed, including eleven added admin safety tests. Existing payment-signature, payment-event, digital-target, notification and inventory-concurrency model tests remain enabled.
- All eight existing QA scripts passed. Catalogue source guards now also cover draft-first creation and QA fixture protection.
- Production build and GET-only home/store/robots/sitemap checks passed.
- `npm audit --omit=dev` reported zero known vulnerabilities at the audit time. This does not establish absence of unknown vulnerabilities.
- All 18 admin views were checked at 320, 375, 390, 428, 768, 1024, 1440 and 1920 px with no document-level horizontal overflow or uncaught runtime errors in the completed layout run.
- The isolated admin interaction run verified finance tabs, navigation, modal dismissal, empty/error/non-admin states, a blocked bulk publication, a failed variant save remaining hidden, and successful publication occurring after variant persistence.
- Seven storefront views at all eight widths passed, including Vinyl/CD/Digital filter URLs, Wear and Bundles. Account, cart and checkout-form drawers were exercised without submitting an order. A hidden/missing product returned 404. Real populated-product visual acceptance remains pending the user's real catalogue and storefront references.
- Browser CI now runs on pull requests as well as main, with explicitly fake database configuration. It uploads screenshots/results as `sideii-admin-browser-evidence`. The workflow also checks modal bounds and focus trapping. Inspect the PR's actual Actions results for the final commit; the workflow definition itself is not proof of success.

## Read-only Supabase findings

- 88 public tables had RLS enabled. This fact alone does not prove every policy or RPC is safe.
- Six QA products were present; zero had `is_public=true`. There were zero production orders at the time of inspection.
- Reviewed payment processing uses server-side amount/currency checks, event uniqueness and order locking. Paid-inventory transitions and refund inventory handling have dedicated idempotency guards. `apply_payment_event` is not executable by anonymous or authenticated clients.
- The current checkout RPC derives prices from the database. Opening an iyziLink URL does not mark the order paid; trusted-host validation is retained.
- Digital delivery uses entitlement consumption and private-storage signed links; existing target allowlist tests passed.
- Anonymous SECURITY DEFINER advisor findings include intentionally public entry points. They were not blanket-revoked. RLS-enabled tables with no direct policies can be intentional RPC-only tables; these findings require function-by-function review.

## Remaining work and release gates

| Priority | Remaining item | Consequence / next action |
| --- | --- | --- |
| High before accepting real payments | Domain, iyziLink configuration and provider sandbox acceptance | No real provider charge/refund was tested. Verify provider references, exact link amounts and manual reconciliation before launch. The generic signed webhook is not evidence of a native iyzico callback integration. |
| Medium | Stock update and movement logging are still separate database requests | Conditional writes prevent stale stock overwrites, but a ledger insert can fail after stock succeeds. The UI reports this explicitly. Move both writes into one audited transactional RPC before high-volume operations. |
| Medium | Product editing spans multiple database requests | A failure can leave a partially updated hidden draft. Review and reopen it before publishing. A transactional product-save RPC is a future improvement; browser readiness checks do not replace server-side validation for privileged direct API callers. |
| Medium | Merch RPC category mismatch | The current database `admin_create_merch` accepts apparel/mug/patch/accessory while the existing form also offers lighter/beanie. Those two category creation paths still require a compatible, tested database migration; they were not silently remapped or removed. |
| Medium | Auth leaked-password protection is disabled | Enable and verify the appropriate Supabase Auth setting before opening public account registration. No auth configuration was changed in this audit. |
| Medium at larger volume | Client report scopes | Order estimates are capped at 1,000 and other audit RPCs have their own limits. Full-ledger reconciliation needs server-side aggregation/exports. Analytics uses current cost estimates; historical accounting requires captured costs and verified VAT settings. |
| Acceptance pending | Real catalogue, taxes/costs/artist agreements and storefront screenshots | The owner supplies the real product content. Complete populated-product and accounting acceptance with those inputs. No real product information was invented. |

This is a tested improvement package, not a claim that every code path or production integration is defect-free. Keep the branch review and the listed launch gates separate from production readiness.

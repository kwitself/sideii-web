# SIDE:II storefront follow-up — 20 October 2026

Branch: `audit/admin-quality-20261018`, continuing the admin audit in PR #2.

## Scope

The 18 supplied storefront screenshots from 19 October were reviewed together with the existing implementation. Changes preserve SIDE:II's black, anthracite and grey identity and Lethargia's burgundy identity. Existing catalogue views, account features and checkout RPCs remain in place.

No production database migration, product publication, real order, payment, refund or email was performed. Application submissions and account/cart requests in browser verification are intercepted local fixtures. The source was checkpointed on the existing GitHub branch after the temporary workspace had to be restored; verification was rerun against the restored implementation.

## Screenshot findings and changes

The screenshot identifiers below are the time suffixes in `image(20261019-...).png`.

| References | Finding | Result |
| --- | --- | --- |
| 195940 | Generic cart error, tiny quantity/remove controls and excessive space before checkout | Explicit availability/retry messages, accessible controls and compact drawer spacing. Checkout requires a valid current server quote. |
| 195950, 195956 | Long account page with many empty sections | Four real sections: Profile, Saved, Collection and Orders. Hidden sections retain form state and leave the keyboard focus cycle. Loading failures have retry. |
| 200019 | Lethargia identity and small explanatory copy | Preserve the imprint palette; improve supporting text and empty-state wording. |
| 200023 | Small production form labels and inputs | Readable fields and selected-service state; preserve entered data after a failed submission and restore the submit control. |
| 200027 | Sparse tracking page and ambiguous failure handling | Compact tracking layout, strict order-number parsing, separate no-match, service-error and rate-limit states. |
| 200034 | Dense policy text | Improve reading size, line height and navigation targets without changing policy wording. |
| 200038 | Small wholesale form | Improve controls and country-code guidance; preserve entries after failure. |
| 200042 | Failed impact loading could resemble verified zero totals | Show connection failure with retry and hide totals until data loads. Label verified campaigns accurately. |
| 200045, 200048, 200056, 200100, 200104, 200105 | Inconsistent empty catalogue/discovery pages | Shared empty-state presentation and useful next links for Archive, Timeline, Credits, Artists and Collections; consistent Bundles copy and spacing. |
| 200114 | Wear copy and empty-object presentation | Readable text and customer-facing empty-state language. |
| 200117 | Empty store looked like an unsuccessful filter; purple-tinted controls | Distinguish empty catalogue, no filter matches and connection failure. Neutral discovery controls and artwork placeholders. |
| 200121 | Home text hierarchy and navigation spacing | Improve supporting copy and reserve space for account, bag and mobile menu controls. |

Pages that lacked a footer now share store, project, policy and tracking links. Existing footers remain on pages that already had them.

## Cart and account correctness

- A quote must contain finite, nonnegative subtotal and total amounts. Malformed responses and service errors cannot enable checkout. Zero-value quotes remain valid.
- Quote identity includes cart variants/quantities, extra support, promo code and email. A late response for an older cart cannot unlock the new cart. Retry and promo removal retain the bag.
- The confirmed subtotal uses the server's amount, including when prices have changed since the item was saved locally. Before confirmation the local amount is explicitly estimated.
- Email-dependent codes can be checked after entering checkout, but both the submit control and the submit handler remain blocked until validation succeeds.
- Account loading tracks request generations, exposes read failures, and avoids restoring stale account data after sign-out. The post-order account shortcut opens Orders directly.
- Drawer headers stay available while scrolling; keyboard focus excludes hidden account sections. Existing order details and Escape behavior remain supported.

## Verification and reproduction

Local verification completed a production build, all 67 Node tests, all eight existing QA scripts, and the new storefront Chromium run. The run covers 15 public routes at 320, 375, 390, 428, 768, 1024, 1440 and 1920 px; all four signed-in account sections at those widths; document overflow and header-control overlap; account loading/retry and order details; empty, populated and unavailable catalogues; search, price filters and classic product cards; malformed/stale/changed-price quotes; expired and email-dependent promo codes; tracking failures; and mocked application failure/retry.

Screenshots at 390 and 1440 px were visually inspected for the store, cart, account, tracking and related layouts. Chromium screenshots are desktop viewport simulations, not physical iOS/Android device acceptance.

```sh
npm ci
node --test tests/*.test.mjs
npm run qa
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sideii_test_only
npm run build
npm run start -- --hostname 127.0.0.1
# With the production server running in the same local network environment:
node scripts/check-storefront-browser.mjs
```

The browser script requires Playwright and Chromium, accepts `SIDEII_CHROMIUM_PATH`, and owns port 54321 for its read-only server-component fixtures. It rejects a nonlocal test target. Never provide production Supabase configuration to this harness. `SIDEII_QA_WIDTHS` narrows a diagnostic run; its default checks all eight widths.

The existing browser CI also retains its seven-view public smoke and all 18 admin-view checks. The new script is added after those checks. CI uploads screenshots and JSON results under `sideii-admin-browser-evidence/storefront`; results for the final commit are linked in the PR. A workflow definition alone is not evidence that its run passed.

## Remaining limits

- An unpublished or unavailable item saved in an old bag remains unavailable. These UI changes do not bypass database stock/publication checks or make QA products public.
- Real product content and artwork, payment-provider acceptance and production order reconciliation still need owner/provider validation. No live checkout was submitted.
- Store and Impact now distinguish failed loading from an empty result. Other optional public index loaders retain their existing empty fallback behavior.
- Existing aggregate-currency assumptions in impact/collector summaries were not changed. The accounting, stock-ledger transaction, merch-category and Auth configuration findings in the admin audit remain open.
- No merge to main or production deployment is part of this patch. The package is reviewable in the existing draft PR.

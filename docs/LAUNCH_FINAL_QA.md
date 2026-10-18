# SIDE:II — One-pass Launch QA

## Automated checks
`npm ci` → `npm run qa` → `npm run build` → start Next.js → `npm run qa:http`.

The CI workflow runs the full sequence on GitHub main. GitHub Actions run status and logs, **not** a deployment status, determine whether the build passes.

## Configuration before public launch
- Set `NEXT_PUBLIC_SITE_URL` to the actual HTTPS domain; confirm metadata, robots.txt and sitemap.xml.
- Configure public Supabase URL and publishable key; keep service-role / secret keys server-side only.
- Set payment provider credentials/links in the appropriate secured environment, verify webhook signatures and event idempotency; use provider sandbox/test mode first.
- Configure order email delivery and verify the notification claims in a controlled test.
- Confirm shipping fees, taxes, country scope, merchandise stock, digital entitlement flow, invoice integrator and returns policy.
- Inspect whether the historical QA cleanup backup should be retained under restricted access; do not publish its contents.
- Verify privacy, distance-sales, payment, return and cookie notices with the responsible business/legal team.

## Human acceptance matrix (staging only)
| Scenario | Expected result |
| --- | --- |
| Vinyl / cassette / merch in stock | Available quantity respected; variants kept separate |
| Sold-out and preorder | Sold-out blocked; preorder limit observed |
| Digital-only cart | No shipping fields required |
| Multiple physical items | Quantity, taxes and shipping total correct |
| Gift card / credit failure after order creation | Existing order displayed; customer instructed not to retry |
| RPC/network failure before confirmation | Cart retained; customer checks order history before retry |
| Guest order | Private access token never exposed in URL logs or analytics |
| Payment success, failure and duplicate callback | Stock and payment event remain consistent |
| Refund and preorder | Inventory finalized once; preorder does not inflate stock |
| Mobile 320 / 375 / 768px and desktop | No clipping; buttons and receipt warnings remain accessible |

## Go/no-go
**No-go** until GitHub Actions QA + production build + HTTP smoke are green, real browser/mobile validation is recorded, and payment provider sandbox + order email tests are signed off.

HTTP smoke uses only GET requests. It does not authorize or perform a charge, stock movement, refund, invoice issuance, or production order.

## Repeatable verification commands
From repository root on a machine with Node 22 and locked dependencies:

```bash
npm ci
npm run qa
npm run build
npm run start
```

In a separate terminal while the application is running:

```bash
npm run qa:http
```

CI performs the same sequence automatically and writes a step-by-step summary.
A workflow configuration, commit status or deployment indicator **is not evidence** that tests passed. Inspect the actual Actions job log for the current commit.

## Release status — pending external verification
- [ ] GitHub Actions: install, source QA, production build and HTTP smoke all show success
- [ ] Browser acceptance: mobile, desktop, keyboard and responsive cart/checkout
- [ ] Payment provider sandbox: success, duplicate event, failure, refund and order reconciliation
- [ ] Order email: delivery to customer and operator; no duplicate sends
- [ ] Public HTTPS URL, production environment and SEO reviewed
- [ ] Final go/no-go authorization from store owner

No real payment, financial posting or order is created by the QA scripts above.

## Automated real-browser acceptance
The separate `SIDE II Browser Smoke` workflow builds the site, starts Next.js,
and opens Home and Store in real headless Chromium at 375, 768 and 1440 px.
It checks HTTP responses, document content and uncaught page errors, and logs
horizontal overflow without failing solely for decorative overflow.
It does **not** complete checkout, contact the payment provider or create an order.

Payment provider sandbox acceptance remains a separate external-system gate:
verify success/failure/duplicate callback, stock, email and refunds using
test credentials, with the store owner reviewing results before enabling live charging.

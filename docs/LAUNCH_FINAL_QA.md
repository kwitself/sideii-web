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

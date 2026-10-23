# SIDE:II Visual Studio

Open **Admin → Visual Studio** or `/admin/editor`. A verified admin also sees **Sayfayı düzenle** on the home, store, release, merch and custom pages. Customers never receive draft data.

## Editing

- Choose Home, Store, Product template or create a custom `/pages/<slug>` page.
- Drag components from the library into the canvas. Section, columns and stack components accept nested children. Drop into a layer's `+` target to nest it; use the up/down controls as a keyboard alternative.
- Click a component to edit text, image, link, layout, typography, spacing, colour and borders. Text fields commit on blur or Enter. Escape cancels the current field.
- Desktop styles are inherited by tablet (900 px) and mobile (600 px). Device controls change the actual layout width, scaled to fit the workspace. `Sığdır` toggles fit/100%.
- The library includes heading, text, image, link/button, video, quote, accordion, products, spacer and divider components, plus composition templates. Save a section as a reusable template; inserting it creates an independent copy with new IDs.
- Image uploads accept JPG, PNG, WebP, AVIF and GIF, up to 10 MB. Assets have public URLs; draft text and layouts remain private. Existing assets can be reused.
- Undo/redo keeps the last 60 in-memory document changes. JSON export/import transfers complete layouts. Unsaved changes have a user-scoped browser recovery copy; a warning appears after reloading.

## Original homepage

The home starter renders the site's original nine sections: hero, capabilities, manifesto, selected releases, imprint, about, production, store and closing. The live site and editor share their markup, styles and catalogue-selection rules. Click an original text or logo to open its field in the inspector. Section typography controls affect its main heading; spacing, colours and responsive overrides remain available.

The canvas runs in an isolated iframe at 1200 × 900, 820 × 1024 or 390 × 844. Storefront media queries and viewport units use that device size, independently of the admin window. Fit scales the viewport without changing its layout. Navigation is inert while editing; open the actual site separately to follow links.

Existing generic drafts and publications are preserved. To replace an older home draft, optionally export its JSON, then select **Gerçek site düzenini yükle** and confirm **Şablonu yükle**. Undo restores the previous in-memory layout. Save remains private and publication remains explicit. No database migration is needed for the original-section widgets.

The store starter uses the owner's published store v1 from 23 October 2026, including its uploaded image, responsive styles and **Keşfet →** button. The image is bundled at `/defaults/store-20261023.jpg`. This same document is the public store fallback and the editor's **Başlangıç şablonu**, so resetting the draft or removing a later publication returns to this baseline. Later saved drafts and publications continue to take precedence.

## Save and publish

`Taslağı kaydet` saves only the private draft. `Yayımla` confirms and atomically saves/publishes the document. Public pages load only the separate publication table. Saving a later draft does not change the live version.

The last 50 server revisions are available in History. Restoring a revision creates a new draft revision; publishing is a separate action. Unpublishing home/store reactivates their project default documents; product returns to its existing JSX storefront. Unpublishing a custom page makes it return 404.

Writes carry an expected version. An editor in another tab cannot silently overwrite a newer version: the API returns HTTP 409 and preserves local changes for export/recovery. Concurrent first creation also uses this check.

## Commerce integration

The store's catalogue/filter module and the product's purchase section use the existing live components. Product gallery, listening, tracklist, notes, imprint and related-product sections can be rearranged separately. Merch uses its existing purchase module and related products in the same product template. Native commerce modules are inert in the editor. Publication requires the catalogue/purchase block to remain present and visible.

Shared navigation, checkout, account, payment and admin workflows remain application components. This editor manages page content and layouts; it does not execute arbitrary HTML, JavaScript, CSS, WordPress plugins or third-party widget scripts. New functionality can be added through the shared widget registry and renderer.

## Data and deployment

`db/visual-page-builder.sql` is the additive schema source. Apply it as `visual_page_builder` to the SIDE:II Supabase project before enabling saves. No initial page is published by installation. Existing product/customer/order records are not modified.

Tables: `site_builder_pages` (private drafts), `site_builder_publications` (public only), `site_builder_revisions` (private history), `site_builder_blocks` (private reusable sections). All have RLS and explicit grants. `save_site_builder_page` is SECURITY INVOKER and checks trusted app metadata; HTTP endpoints additionally verify the current user with Auth. The public renderer validates stored documents again. The `site-builder-assets` bucket has admin-only insertion and public image delivery.

Documents are limited to 300 nodes, eight nesting levels and 400 KB. URL, style, widget and property allowlists are shared by editor/API/public renderer. Custom page keys cannot shadow application routes.

## Verification

- `node --test tests/page-builder.test.mjs`: nesting, moves, cycles, copies, size, URLs, styles and commerce guards.
- `tests/page-builder-postgres.sql`: isolated PostgreSQL tests of RLS, customer/anonymous denial, draft isolation, version conflicts, restoration and revision retention. **Never run this fixture on a real project.** CI provides the disposable database.
- `scripts/check-page-builder-browser.mjs`: Chromium end-to-end tests with an isolated local Supabase fixture, real Next API handlers, media upload, drag/drop, undo/redo, drafts, publication, conflicts, offline recovery, restoration, custom routes and responsive screenshots. No production writes occur.

Run the existing Node, QA, production build and browser suites as regression gates. Published catalogue data is not required to open the editor: empty commerce previews describe their purpose until products exist.

# SIDE:II Visual Studio

Open **Admin → Visual Studio** or `/admin/editor`. A verified admin also sees **Sayfayı düzenle** on the home, store, release, merch and custom pages. Customers never receive draft data.

## Editing

- Choose **Ortak tasarım ve menüler**, Home, Store, Product template, a shared section, or create a custom `/pages/<slug>` page.
- Drag components from the library into the canvas. Section, columns and stack components accept nested children. Drop into a layer's `+` target to nest it; use the up/down controls as a keyboard alternative.
- Click a component to edit text, image, link, layout, typography, spacing, colour and borders. Text fields commit on blur or Enter. Escape cancels the current field.
- Desktop styles are inherited by tablet (900 px) and mobile (600 px). Device controls change the actual layout width, scaled to fit the workspace. `Sığdır` toggles fit/100%.
- The library includes heading, text, image, link/button, video, quote, accordion, products, spacer and divider components, plus composition templates. Save a section as a reusable template; inserting it creates an independent copy with new IDs.
- Image uploads accept JPG, PNG, WebP, AVIF and GIF, up to 10 MB. Assets have public URLs; draft text and layouts remain private. Existing assets can be reused.
- Undo/redo keeps the last 60 in-memory document changes. JSON export/import transfers complete layouts. Unsaved changes have a user-scoped browser recovery copy; a warning appears after reloading.

## Fonts and design controls

New components and page/section templates inherit the published site theme. Native defaults are Georgia headings, Arial body text and the existing SIDE:II palette. Font pickers display the resolved family with **Temadan**; **Temadan al** or resetting the font removes only the active override. Page, parent, component and device choices remain explicit overrides. Existing saved styles and the owner’s store default are preserved. New templates do not save fixed font/colour values, so later site-theme changes continue to flow through them.

Open a component's **Tasarım → Tipografi** panel. **Yazı tipi seç** opens a searchable, categorized font catalogue with live previews and a Turkish character sample. The 15 choices include the original Arial/Georgia/monospace options and 12 bundled variable families: Inter, Manrope, DM Sans, Space Grotesk, Montserrat, Oswald, Playfair Display, Lora, Cormorant Garamond, Roboto Slab, Bodoni Moda and JetBrains Mono. **Sayfa teması** sets a page font; component and device overrides take precedence. Native home sections apply component typography to their main heading.

Six **Hazır metin stili** presets apply typography in one undoable step, with sizes adapted to the active device. Font weight, italic, underline/strike-through, letter case, line height, letter/word spacing and alignment can also be set independently. These controls format a complete component. Double-click text on the canvas for selected-word formatting: bold, italic, underline, colour and a safe link. **Bitti** or clicking outside commits one undoable change; Escape cancels. Paste accepts plain text. The stored format is a bounded list of text runs, never executable HTML. Links inside existing native links/buttons are disabled to avoid nested anchors.

Image/video controls offer natural or fixed aspect ratios, cover/contain, a fixed height and nine focal positions. A fixed height takes precedence over the aspect ratio. Backgrounds support solid colours or two-colour gradients with an angle; tablet/mobile changes inherit the previous device's other gradient values. Colours accept HEX, palette swatches or transparency. Borders have solid/dashed/dotted/double styles, radius and width; five shadow choices include an explicit no-shadow option.

**Stili kopyala / Stili yapıştır** copies all three device style sets between components while preserving content, IDs, children and links. Pasting replaces the target's style sets; Undo restores them. The style clipboard lasts for the current editor session. **Sıfırla** clears only the active device's overrides. Empty inputs inherit the larger device's value; mobile inherits tablet, then desktop.

Fonts are served from `/fonts/builder/` without a visitor request to Google and are fetched by the browser only when used (opening the font catalogue also loads its previews). `sources.json` pins the upstream revision, original and compressed hashes, weights and licenses. The complete normal variable fonts use lossless WOFF2 compression; italic is browser-synthesized. Bundled fonts require no external font API or app dependency. Uploaded custom fonts use the additive Studio migration described below. Existing font IDs and documents remain valid.

## Shared design, header and footer

Choose **Ortak tasarım ve menüler**. The design tab contains independent body/heading fonts, site/text/heading/accent colours, button colours/radius/padding, section spacing and content width. Empty values preserve the existing design. Explicit page/component/device styles take precedence. Header/footer customization is opt-in; use their checkboxes to enable it and preview before publication.

Header settings include logo, announcement text/link, sticky positioning, mobile menu label and ordered navigation links. Up to six primary links can appear on desktop; additional links belong in Explore or only on mobile. Footer settings include logo, description, copyright, navigation and social links. Public routes share the same published settings. The editor previews a private settings draft without applying it to the admin interface.

Upload your own **WOFF2** in the design tab: up to 12 fonts, 2 MB each. The browser verifies decoding before upload and the server checks the WOFF2 container and size. Uploads use immutable UUID paths. Choose the new family from the font picker, then publish site settings so every page can load it. Uploaded files have public URLs; use fonts you are licensed to serve. Removing/resetting the settings does not delete files.

## Canvas sizing and shared sections

Selecting a component shows width handles. Images/video also have height handles; containers have bottom-padding handles, and two-column layouts have a ratio handle. Drag or use arrow keys; Shift changes keyboard steps and disables pointer snapping. Width/ratio dragging snaps near common fractions. The value is stored in the active device's style and committed as one undoable change. Escape cancels an in-progress drag.

**Bölümü şablon olarak kaydet** still creates an independent template. **Ortak bölüm olarak kaydet** creates a separate private `block:` document and opens it for editing. Publish it, then add an **Ortak bölüm** widget on any page and select it. Publishing a new block version updates every linked page; draft edits stay private. Shared blocks cannot contain shared blocks or native commerce slots. Blocks are limited to 60 nodes and a page to 20 instances, bounding the expanded render to 1,500 nodes. A referenced block cannot be unpublished until its published/scheduled references are removed.

## Media and content widgets

The media dialog supports name search, folders, pagination, renaming and a **Kullanıldığı sayfalar** report covering saved drafts, current publications and future plans. Names/folders are metadata; changing them preserves every existing URL. Reports scan at most 10,000 rows per source and explicitly flag incomplete results. Unsaved browser-only edits are not part of the report.

Optional upload optimization reduces still images to at most 2,400 px and uses WebP at 0.86 quality only when the result is smaller. GIF files are kept intact. If the metadata write fails after upload, **Arşiv kaydını yeniden dene** reuses the uploaded file. Sequential name/folder edits are queued to avoid overwriting each other.

New widgets: a real catalogue album card, artist card, native audio player (no autoplay), event list (up to 30), countdown, and gallery (up to 24 images; grid, masonry or horizontal rail). Product vitrines support grid, horizontal rail and featured-first layouts. Prices, availability and purchase behavior continue to come from catalogue data. Dates are entered in the browser's local time zone and stored with an explicit offset/UTC; visitor date labels use Europe/Istanbul.

## Identity artwork and responsive presentation

The add-on editorial refinement in `app/components/builder/page-canvas-responsive-refine.css` is shared by the public site and Visual Studio. Logos/wordmarks sourced from the site's `/brand/` directory display fully rather than being cropped as photographs in artist and gallery widgets. A standalone brand image adopts an editorially restrained width and height only while its image dimensions are uncustomized; explicit width/max-width, media height, aspect ratio, focal point or contain-fit overrides remain authoritative.

Small-screen grid galleries default to two compact columns; masonry, rail and normal album photographs keep their own layout/crop behaviour. Buttons have a slightly clearer default type scale, while user font settings take precedence. Unconfigured videos show an intentional empty-state label instead of an unexplained blank block in the published view; the media-entry prompt remains in editing mode. No stored content, database schema, theme settings or catalogue/shop logic is modified.

The Chromium fixture checks identity artwork cropping, mobile grid density, a single countdown, custom responsive bounds and scroll overflow. Hover animations remain pointer-aware, keyboard focus stays visible, and reduced-motion preferences are respected.

## SEO, publication review and scheduling

**Yayın ve SEO** edits page title, description, sharing image and noindex. Product templates support `{title}` and `{artist}` placeholders. Blank values retain existing metadata/canonical behavior. Noindex pages are omitted from the sitemap. Review lists additions, removals, content/order changes and design/SEO changes before publication.

**Yayını planla** saves an immutable copy of the current draft for a time 1 minute to 366 days ahead. Later draft saves do not alter it. **Planı bu sürümle güncelle** explicitly replaces the pending copy; **Planı iptal et** leaves current live content and the draft intact. Manual publish/unpublish supersedes any pending plan. At the due time, the first request reads the scheduled snapshot; no cron job is required and already-open browser pages are not pushed a live refresh. Replanning after a due time materializes the previous due version before creating a new plan, so visitors never revert to an older publication.

## Original homepage

The home starter renders the site's original nine sections: hero, capabilities, manifesto, selected releases, imprint, about, production, store and closing. The live site and editor share their markup, styles and catalogue-selection rules. Click an original text or logo to open its field in the inspector. Section typography controls affect its main heading; spacing, colours and responsive overrides remain available.

The canvas runs in an isolated iframe at 1200 × 900, 820 × 1024 or 390 × 844. Storefront media queries and viewport units use that device size, independently of the admin window. Fit scales the viewport without changing its layout. Navigation is inert while editing; open the actual site separately to follow links.

Standalone addons use a centred frame following the site's content width (1440 px by default), with 32/24/20 px minimum side gutters on desktop/tablet/mobile. On wide home screens (1600 px and above), standalone addon content aligns with the effective native `.shell` text edges instead of being capped at the old 1440 px island; at 2200 px and above it follows the existing ultrawide shell. Explicit published site content width remains a cap. Editor 1200/820/390 px layouts, custom pages and nested containers retain the existing defaults. Default vertical margins are 24 px (16 px on mobile), leaving 48/32 px between neighbouring addons. Containers keep their own child gap, shared blocks avoid duplicated outer spacing, and native storefront sections keep their original layout. Saved width, margin and device overrides still take precedence; resetting a control restores the defaults without rewriting existing documents.

Existing generic drafts and publications are preserved. To replace an older home draft, optionally export its JSON, then select **Gerçek site düzenini yükle** and confirm **Şablonu yükle**. Undo restores the previous in-memory layout. Save remains private and publication remains explicit. No database migration is needed for the original-section widgets.

The store starter uses the owner's published store v1 from 23 October 2026, including its uploaded image, responsive styles and **Keşfet →** button. The image is bundled at `/defaults/store-20261023.jpg`. This same document is the public store fallback and the editor's **Başlangıç şablonu**, so resetting the draft or removing a later publication returns to this baseline. Later saved drafts and publications continue to take precedence.

## Save and publish

`Taslağı kaydet` saves only the private draft. `Yayımla` confirms and atomically saves/publishes the document. Public pages load the separate publication table plus any due immutable scheduled snapshot. Saving a later draft does not change the live version.

The last 50 server revisions are available in History. Restoring a revision creates a new draft revision; publishing is a separate action. Unpublishing home/store reactivates their project default documents; product returns to its existing JSX storefront. Unpublishing a custom page makes it return 404.

Writes carry an expected version. An editor in another tab cannot silently overwrite a newer version: the API returns HTTP 409 and preserves local changes for export/recovery. Concurrent first creation also uses this check.

## Commerce integration

The store's catalogue/filter module and the product's purchase section use the existing live components. Product gallery, listening, tracklist, notes, imprint and related-product sections can be rearranged separately. Merch uses its existing purchase module and related products in the same product template. Native commerce modules are inert in the editor. Publication requires the catalogue/purchase block to remain present and visible.

Header/footer configuration feeds the existing accessible navigation and footer components. Checkout, account, payment and admin workflows remain application components. This editor manages page content, shared design and layouts; it does not execute arbitrary HTML, JavaScript, CSS, WordPress plugins or third-party widget scripts. New functionality can be added through the shared widget registry and renderer.

## Data and deployment

`db/visual-page-builder.sql` is the additive schema source. Apply it as `visual_page_builder` to the SIDE:II Supabase project before enabling saves. No initial page is published by installation. Existing product/customer/order records are not modified.

Apply `supabase/migrations/20261025100149_visual_studio_complete.sql` after the foundation migration. It adds optional site/block keys, scheduled snapshots, media metadata and the custom-font bucket. It does not change or publish existing page content.

Tables: `site_builder_pages` (private drafts), `site_builder_publications` (public only), `site_builder_revisions` (private history), `site_builder_blocks` (private independent templates), `site_builder_schedules` (future snapshots private; due snapshots publicly readable), `site_builder_assets` (admin-only media names/folders). All have RLS and explicit grants. `save_site_builder_page` is SECURITY INVOKER and checks trusted app metadata; HTTP endpoints additionally verify the current user with Auth. The public renderer validates stored documents again. The `site-builder-assets` bucket has admin-only insertion and public image delivery.

Documents are limited to 300 nodes, eight nesting levels and 400 KB. URL, style, widget and property allowlists are shared by editor/API/public renderer. Custom page keys cannot shadow application routes.

## Verification

- `node --test tests/page-builder.test.mjs`: nesting, moves, cycles, copies, size, URLs, styles and commerce guards.
- `node --test tests/studio-plus.test.mjs`: new document contracts, rich-text boundaries, reference bounds, metadata and snapshot selection.
- `tests/studio-plus-postgres.sql`: real PostgreSQL RLS, immutable schedules, cancellation/replanning, conflicts and shared-reference guards.
- `tests/page-builder-postgres.sql`: isolated PostgreSQL tests of RLS, customer/anonymous denial, draft isolation, version conflicts, restoration and revision retention. **Never run this fixture on a real project.** CI provides the disposable database.
- `scripts/check-page-builder-browser.mjs`: Chromium end-to-end tests with an isolated local Supabase fixture, real Next API handlers, media upload, drag/drop, undo/redo, drafts, publication, conflicts, offline recovery, restoration, custom routes and responsive screenshots. No production writes occur.
- The same suite checks editor/public catalogue parity for album cards and product grids, including Lethargia, shared sections, release pages and merch pages. `SIDEII_CATALOGUE_ONLY=1` runs this regression alone; private/draft products stay excluded and native homepage sections retain their curation.
- `SIDEII_LAYOUT_ONLY=1` checks every addon type in editor/public layouts at 1200/820/390 px, wide-screen bounds, nested/shared spacing, custom pages, responsive overrides, reset and hidden widgets.
- `scripts/check-builder-design-tools.mjs` runs inside that suite: all 12 bundled fonts must decode as real FontFace entries, new styles survive save/reload/publication, and editor/public rendering agrees at 1200/820/390 px. Copy/paste, undo, device resets, gradients and image focal points are exercised through the UI.

- `scripts/check-studio-plus.mjs` runs inside the browser suite: uploaded font decoding, global navigation/footer, rich text, sizing, media metadata/compression/usage, all new widgets, audio playback, shared sections and scheduling. `SIDEII_STUDIO_PLUS_ONLY=1` runs just this focused flow.

Run the existing Node, QA, production build and browser suites as regression gates. Published catalogue data is not required to open the editor: empty commerce previews describe their purpose until products exist.

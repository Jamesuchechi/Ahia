# Ahia — Build & Transformation TODO

Status key: `[ ]` not started · `[~]` in progress · `[x]` done

This file tracks the transformation of Ahia from a static, jewelry-only frontend prototype into a real, general-purpose, multi-category e-commerce platform with an admin dashboard. Phases are sequential — each one depends on the ones before it, so don't skip ahead even if a later phase looks more exciting.

---

## Phase 0 — Foundation & Setup
Goal: get a real backend in place. Nothing after this phase is honest without it.

- [x] Create Supabase project (or chosen backend) for Ahia
- [x] Set up environment variables (`.env`, `.env.example`) — currently the app has none
- [x] Add Supabase client to the codebase (`src/lib/supabase.ts`)
- [x] Set up local dev workflow for running migrations
- [x] Decide and document hosting/deploy target (Vercel/Netlify/other) — none exists today
- [x] Set up basic CI (lint + type-check on push, at minimum)



## Phase 1 — Database Schema
Goal: model products generically from day one, not jewelry-first.

- [x] `categories` table (self-referencing for subcategories, slug, name, sort order)
- [x] `products` table (name, slug, description, base_price, status, category_id, timestamps)
- [x] `attributes` table (e.g. Size, Color, Material — reusable across categories)
- [x] `attribute_values` table (e.g. "Small", "Red", "Gold" — linked to an attribute)
- [x] `product_variants` table (SKU, price override, stock qty, linked to a product)
- [x] `variant_attribute_values` join table (which attribute values define a given variant)
- [x] `product_images` table (product_id or variant_id, url, alt text, sort order)
- [x] `profiles` table (linked to Supabase auth user, role: customer/admin)
- [x] `carts` and `cart_items` tables
- [x] `orders`, `order_items`, `order_status_history` tables
- [x] `reviews` table (product_id, user_id, rating, body, created_at)
- [x] `discounts`/`coupons` table (code, type, value, constraints, active window)
- [x] Write RLS policies for every table (public read on published products/categories, admin-only write, user-scoped read/write on carts/orders)
- [x] Seed script with a handful of realistic multi-category products for dev/testing


## Phase 2 — Auth & Roles
Goal: know who's a customer and who's an admin. Currently there is no auth at all.

- [x] Supabase auth: email/password signup + login
- [x] Session handling in the app (logged-in state, protected routes)
- [x] Logout flow
- [x] `profiles.role` set to `customer` by default on signup
- [x] Manual/seeded process for promoting a user to `admin`
- [x] Route guard for `/admin/*` — redirect non-admins
- [ ] (Optional, later) social login, password reset flow

## Phase 3 — Admin Dashboard: Core CRUD
Goal: products get added and managed through the admin, not hardcoded in components.

- [x] Admin shell/layout with nav (`/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`)
- [x] Category CRUD (create, edit, reorder, nest, delete with guard if products exist)
- [x] Attribute CRUD (create attribute types and their possible values)
- [x] Product CRUD (create/edit/archive, assign category, write description/price)
- [x] Variant management UI (attach attribute combinations, set stock/SKU/price override per variant)
- [x] Image upload UI (Supabase Storage or Cloudflare R2), reorder, set alt text
- [x] Bulk CSV import for products (big time-saver once catalog grows)
- [x] Inventory view with low-stock indicator
- [x] Order list + detail view, status update action
- [x] Basic dashboard stats (revenue, order count, top products)

## Phase 4 — Storefront: Replace Mock Data
Goal: kill every hardcoded array; the frontend should reflect real DB state.

- [x] `Index.tsx` — pull featured categories/products from DB instead of hardcoded sections
- [x] `Category.tsx` / `ProductGrid.tsx` — fetch products by category from DB
- [x] `ProductDetail.tsx` — **fix the bug where `productId` is ignored**; fetch the actual product and its variants/images
- [x] `FilterSortBar.tsx` — wire checkboxes to real query params/filter state
- [x] Sorting dropdown — actually re-query/re-order results
- [x] `Pagination.tsx` — wire to real result counts, not a static mockup
- [x] Search bar in `Navigation.tsx` — wire to a real query (start with Postgres full-text search)
- [x] `ProductCarousel.tsx` — pull from DB (e.g. "featured" flag or "new" flag)

## Phase 5 — Cart & Checkout (Real)
Goal: replace the fake in-memory cart and the `setTimeout` fake checkout.

- [x] Cart persisted per session (guest) and per user (logged in) — guest carts use local storage, and signed-in carts sync to Supabase when available
- [x] `ShoppingBag.tsx` reads/writes real cart state instead of mock initial items
- [x] Cart merges guest cart into user cart on login
- [x] Checkout form data (address, shipping) saved against the order, not thrown away
- [x] Real shipping method logic (even simple flat-rate per category/weight to start)
- [x] Discount code field actually validates against `discounts` table

## Phase 6 — Payments & Order Lifecycle
Goal: replace the fake 2-second spinner with real payment and a real order record.

- [x] Integrate Paystack (or Flutterwave/Stripe) for payment
- [x] Webhook handler to confirm payment and update order status
- [x] Order status lifecycle: `pending` → `paid` → `shipped` → `delivered` (+ `cancelled`/`refunded`)
- [x] Order confirmation shown to user from real order data, not a static message
- [x] Admin can view/update order status manually

## Phase 7 — Supporting Features
Goal: round out the commerce experience.

- [x] Reviews: wire `ReviewProduct.tsx` submission to the `reviews` table (currently just `console.log`s)
- [x] Display real reviews on `ProductDescription.tsx` instead of the 3 hardcoded ones
- [x] Wishlist/favorites (persisted, not just a UI trigger)
- [x] Coupons/discounts management in admin
- [ ] Store locator — either keep as real static content (rename/repurpose) or remove if no longer relevant to a general e-commerce brand

## Phase 8 — Notifications
- [x] In-app notifications for order updates and other events
- [x] Order confirmation email (Resend/SendGrid/etc.)
- [x] Admin new-order alert
- [x] Contact form (`CustomerCare.tsx`) actually sends somewhere instead of reloading the page

## Phase 9 — Content & Brand De-Jewelry Pass
Goal: lowest technical risk, do this once the app actually functions. Update copy/imagery in:
- [x] `Footer.tsx`, `LargeHero.tsx`, `EditorialSection.tsx`
- [x] `FiftyFiftySection.tsx`, `OneThirdTwoThirdsSection.tsx`
- [x] `OurStory.tsx`, `Sustainability.tsx`
- [x] `SizeGuide.tsx` — either generalize (per-category sizing) or make category-conditional
- [x] `PrivacyPolicy.tsx`, `TermsOfService.tsx` — replace "Ahia Jewelry Inc." references
- [x] `Navigation.tsx` — replace hardcoded jewelry categories with dynamic categories from DB

## Phase 10 — Boutique & Fashion Enhancements
- [x] Multi-dimensional product variants (visual color and size swatches, smart stock indicators)
- [x] Category-conditional dynamic Size Guide tabs
- [x] Visual Lookbooks / Curated Collections page
- [x] High-resolution hover zoom & improved product detail image gallery carousel
- [x] Related products recommendation / "Complete the Look"

## Phase 11 — Testing & QA
- [ ] Add a test runner (Vitest recommended given the Vite setup)
- [ ] Unit tests for cart logic, price/discount calculations
- [ ] Integration tests for checkout → order creation → payment confirmation
- [ ] RLS policy tests (confirm non-admins truly can't write to admin-only tables)
- [ ] Manual QA pass across all pages listed in the audit

## Phase 12 — Production Readiness
- [ ] Deployment pipeline (Vercel/Netlify + Supabase production project)
- [ ] SEO basics: meta tags, sitemap, per-product/category URLs
- [ ] Error monitoring (Sentry or similar)
- [ ] Rate limiting / abuse protection on public write endpoints (reviews, checkout, contact form)
- [ ] Performance pass (image optimization, code splitting if needed)

## Stretch / Later
- [ ] Multi-currency support
- [ ] Multiple payment providers
- [ ] Analytics dashboard beyond the basics (conversion funnel, cart abandonment)
- [ ] Social login
- [ ] Customer order history / account page
- [ ] Admin roles beyond a single "admin" flag (e.g. staff vs owner)

---

**Working principle:** don't build Phase N+1 features on top of Phase N mock data. If something in the storefront still reads from a hardcoded array, it's not done — it's a placeholder waiting on the phase above it.
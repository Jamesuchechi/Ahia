# Ahia

Ahia is a multi-category e-commerce platform, built with a fully managed admin dashboard for product, order, and catalog management. It started as a jewelry storefront concept and is being rebuilt into a general-purpose store that can sell any kind of product — clothing, electronics, home goods, jewelry, or anything else — without code changes for new product types.

The name comes from the Igbo word for "market."

## What this is becoming

Ahia is not just a storefront template — it's a full commerce system with two sides:

- **Storefront** — the public-facing shopping experience: browsing categories, viewing products, adding to cart, and checking out.
- **Admin dashboard** — where products, categories, inventory, and orders are actually managed. Products are added and edited through the admin, not hardcoded into the frontend.

The core design principle is a **generic product model**: instead of fixed fields like "ring size" or "carat," products are described using flexible attributes (Size, Color, Material, Storage, whatever a category needs) so the same system can sell a t-shirt and a necklace side by side.

## Current status

This project is mid-transformation. The existing frontend is a polished, fully-styled UI shell (React + Tailwind + Radix), but as of now it has **no backend, no database, no auth, and no real payment processing** — products, cart contents, and reviews are hardcoded mock data. See [`todo.md`](./todo.md) for the full phase-by-phase build plan that turns this into a working, data-driven platform.

## Tech stack

**Frontend**
- React 18 + TypeScript
- Vite (build tool/dev server)
- React Router for routing
- Tailwind CSS + Radix UI primitives for styling/components
- TanStack React Query for data fetching (planned — configured but not yet wired to real data)

**Backend (planned/in progress)**
- Supabase (Postgres, Auth, Storage) as the primary backend
- Row-Level Security for access control (public read on published catalog data, admin-only writes, user-scoped carts/orders)

**Payments (planned)**
- Paystack / Flutterwave for checkout

## Architecture overview

```
Storefront (public)          Admin Dashboard (role-gated)
      │                              │
      └──────────────┬───────────────┘
                      │
              Supabase (Postgres + Auth + Storage)
                      │
        categories · products · variants · attributes
        product_images · carts · orders · reviews · discounts
```

Products are modeled generically:

- A **product** belongs to a **category** and has a base description/price.
- A product can have multiple **variants** (e.g. Size: M / Color: Blue), each with its own stock and optional price override.
- Variants are built from **attributes** and **attribute values**, which are reusable across categories — so "Color" isn't redefined for every product type.
- **Images** attach to either the product or a specific variant.

This is what allows the admin to add a completely new kind of product (say, sneakers) without any schema or code changes — just new category/attribute data.

## Project structure

```
src/
├── pages/            # Route-level views (storefront + about pages)
│   └── about/         # Brand/info pages (story, sustainability, size guide, etc.)
├── components/
│   ├── header/         # Site navigation, cart drawer
│   ├── footer/         # Site footer
│   ├── content/         # Homepage layout sections
│   ├── category/        # Category listing, filters, pagination
│   ├── product/         # Product detail, image gallery, reviews
│   ├── about/           # Shared layout pieces for info pages
│   └── ui/              # Radix-based UI primitives
├── hooks/              # Custom React hooks
├── lib/                # Shared utilities
└── App.tsx             # Routing + providers
```

An `admin/` section (routes + components) will be added under role-gated auth as part of the build plan — see `todo.md` Phase 3.

## Getting started

```bash
# install dependencies
npm install

# run the dev server
npm run dev
```

> Note: until backend integration (Phase 0–1 of `todo.md`) is complete, the app runs entirely on mock data — cart contents and product details will not persist or reflect real input.

### Environment variables

Copy `.env.example` to `.env` and fill in your Supabase project URL and anonymous API key:

```bash
cp .env.example .env
```

Required variables:
- `VITE_SUPABASE_URL`: The API URL of your Supabase project (found in project settings).
- `VITE_SUPABASE_ANON_KEY`: The anonymous API key of your Supabase project (found in project settings).

## Local Database & Migrations

Ahia uses the Supabase CLI to manage database migrations locally.

1. **Start local Supabase services** (requires Docker running):
   ```bash
   npm run supabase:start
   ```
2. **Create a new migration file**:
   ```bash
   npm run supabase:migration <migration_name>
   ```
3. **Reset local database & apply all migrations**:
   ```bash
   npm run supabase:reset
   ```
4. **Link local project to your remote Supabase project**:
   ```bash
   npm run supabase:link -- --project-ref <your-project-ref>
   ```
5. **Push local migrations to the remote database**:
   ```bash
   npm run supabase:deploy
   ```

### Promoting a User to Admin

Ahia supports two roles: `customer` (default) and `admin`. To promote a customer to an admin, run the SQL script in [supabase/promote_admin.sql](file:///home/jamesuchechi/Projects/Ahia/supabase/promote_admin.sql) in your Supabase project's SQL editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@ahia.shop'
);
```

## Deployment & Hosting

### Frontend Hosting
The storefront and admin dashboard are designed for hosting on **Vercel** or **Netlify** (built directly from the static build output using Vite).
* Build Command: `npm run build`
* Publish Directory: `dist`

Ensure the following environment variables are set in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend Hosting
The database, storage, and authentication are fully managed by **Supabase**.

## Roadmap

The full transformation plan — from current static prototype to a real multi-category store with an admin dashboard — is tracked phase-by-phase in [`todo.md`](./todo.md). Work is sequential: later phases assume earlier ones are done, since building storefront features on top of mock data creates rework later.

## License

TBD.
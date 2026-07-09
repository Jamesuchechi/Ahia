-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles Table
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    updated_at timestamptz,
    first_name text DEFAULT '',
    last_name text DEFAULT '',
    phone text DEFAULT '',
    role text DEFAULT 'customer' NOT NULL CHECK (role IN ('customer', 'admin'))
);

-- Categories Table
CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Products Table
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text DEFAULT '',
    base_price numeric(12,2) NOT NULL CHECK (base_price >= 0),
    status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Attributes Table
CREATE TABLE public.attributes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Attribute Values Table
CREATE TABLE public.attribute_values (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id uuid REFERENCES public.attributes(id) ON DELETE CASCADE NOT NULL,
    value text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (attribute_id, value)
);

-- Product Variants Table
CREATE TABLE public.product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sku text UNIQUE,
    price_override numeric(12,2) CHECK (price_override >= 0),
    stock_qty integer DEFAULT 0 NOT NULL CHECK (stock_qty >= 0),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Variant Attribute Values (Join Table)
CREATE TABLE public.variant_attribute_values (
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
    attribute_value_id uuid REFERENCES public.attribute_values(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (variant_id, attribute_value_id)
);

-- Product Images Table
CREATE TABLE public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
    url text NOT NULL,
    alt_text text DEFAULT '',
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    CHECK (product_id IS NOT NULL OR variant_id IS NOT NULL)
);

-- Carts Table
CREATE TABLE public.carts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Cart Items Table
CREATE TABLE public.cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
    quantity integer DEFAULT 1 NOT NULL CHECK (quantity > 0),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (cart_id, variant_id)
);

-- Discounts Table
CREATE TABLE public.discounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value numeric(12,2) NOT NULL CHECK (value > 0),
    min_order_value numeric(12,2) DEFAULT 0.00 NOT NULL CHECK (min_order_value >= 0),
    starts_at timestamptz,
    ends_at timestamptz,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Orders Table
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    shipping_address text NOT NULL,
    shipping_city text NOT NULL,
    shipping_postal_code text NOT NULL,
    shipping_country text NOT NULL,
    billing_address text,
    billing_city text,
    billing_postal_code text,
    billing_country text,
    shipping_option text NOT NULL,
    shipping_cost numeric(12,2) DEFAULT 0.00 NOT NULL CHECK (shipping_cost >= 0),
    subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount numeric(12,2) DEFAULT 0.00 NOT NULL CHECK (discount_amount >= 0),
    total numeric(12,2) NOT NULL CHECK (total >= 0),
    status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
    discount_id uuid REFERENCES public.discounts(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Order Items Table
CREATE TABLE public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
    sku text,
    name text NOT NULL,
    price numeric(12,2) NOT NULL CHECK (price >= 0),
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Order Status History Table
CREATE TABLE public.order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status text NOT NULL,
    notes text DEFAULT '',
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Reviews Table
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    body text DEFAULT '',
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (product_id, user_id)
);

-- TRIGGERS & PROCEDURES FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    new.updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Trigger to automatically create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        COALESCE(new.phone, ''),
        'customer'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROW LEVEL SECURITY ACTIVATION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles
CREATE POLICY "Users can read their own profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Categories
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- Products
CREATE POLICY "Anyone can read published products" ON public.products FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());

-- Attributes
CREATE POLICY "Anyone can read attributes" ON public.attributes FOR SELECT USING (true);
CREATE POLICY "Admins can manage attributes" ON public.attributes FOR ALL USING (public.is_admin());

-- Attribute Values
CREATE POLICY "Anyone can read attribute values" ON public.attribute_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage attribute values" ON public.attribute_values FOR ALL USING (public.is_admin());

-- Product Variants
CREATE POLICY "Anyone can read variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (public.is_admin());

-- Variant Attribute Values
CREATE POLICY "Anyone can read variant attributes" ON public.variant_attribute_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage variant attributes" ON public.variant_attribute_values FOR ALL USING (public.is_admin());

-- Product Images
CREATE POLICY "Anyone can read product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (public.is_admin());

-- Carts
CREATE POLICY "Users can manage their own carts" ON public.carts FOR ALL USING (auth.uid() = user_id);

-- Cart Items
CREATE POLICY "Users can manage their own cart items" ON public.cart_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.carts
        WHERE id = cart_items.cart_id AND user_id = auth.uid()
    )
);

-- Discounts
CREATE POLICY "Anyone can read discount codes" ON public.discounts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage discounts" ON public.discounts FOR ALL USING (public.is_admin());

-- Orders
CREATE POLICY "Anyone can insert orders for checkout" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.is_admin());

-- Order Items
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own order items" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = order_items.order_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.is_admin());

-- Order Status History
CREATE POLICY "Users can read status history for their orders" ON public.order_status_history FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = order_status_history.order_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage order status history" ON public.order_status_history FOR ALL USING (public.is_admin());

-- Reviews
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update/delete their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any review" ON public.reviews FOR DELETE USING (public.is_admin());


-- SEED DATA

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'Jewelry', 'jewelry', 1),
('c0000000-0000-0000-0000-000000000002', 'Clothing', 'clothing', 2),
('c0000000-0000-0000-0000-000000000003', 'Electronics', 'electronics', 3);

INSERT INTO public.categories (id, parent_id, name, slug, sort_order) VALUES
('c0000000-0000-0000-0000-000000000101', 'c0000000-0000-0000-0000-000000000001', 'Earrings', 'earrings', 1),
('c0000000-0000-0000-0000-000000000102', 'c0000000-0000-0000-0000-000000000001', 'Bracelets', 'bracelets', 2),
('c0000000-0000-0000-0000-000000000103', 'c0000000-0000-0000-0000-000000000001', 'Rings', 'rings', 3),
('c0000000-0000-0000-0000-000000000104', 'c0000000-0000-0000-0000-000000000001', 'Necklaces', 'necklaces', 4),
('c0000000-0000-0000-0000-000000000201', 'c0000000-0000-0000-0000-000000000002', 'T-Shirts', 't-shirts', 1),
('c0000000-0000-0000-0000-000000000202', 'c0000000-0000-0000-0000-000000000002', 'Hoodies', 'hoodies', 2);

-- 2. Insert Attributes
INSERT INTO public.attributes (id, name) VALUES
('a0000000-0000-0000-0000-000000000001', 'Size'),
('a0000000-0000-0000-0000-000000000002', 'Color'),
('a0000000-0000-0000-0000-000000000003', 'Material');

-- 3. Insert Attribute Values
INSERT INTO public.attribute_values (id, attribute_id, value) VALUES
-- Sizes (Clothing)
('b0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000001', 'S'),
('b0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 'M'),
('b0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000001', 'L'),
('b0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000001', 'XL'),
-- Ring Sizes
('b0000000-0000-0000-0000-000000000111', 'a0000000-0000-0000-0000-000000000001', '54 EU / 7 US'),
('b0000000-0000-0000-0000-000000000112', 'a0000000-0000-0000-0000-000000000001', '56 EU / 8 US'),
-- Colors
('b0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000002', 'Black'),
('b0000000-0000-0000-0000-000000000202', 'a0000000-0000-0000-0000-000000000002', 'White'),
('b0000000-0000-0000-0000-000000000203', 'a0000000-0000-0000-0000-000000000002', 'Gold'),
('b0000000-0000-0000-0000-000000000204', 'a0000000-0000-0000-0000-000000000002', 'Silver'),
-- Materials
('b0000000-0000-0000-0000-000000000301', 'a0000000-0000-0000-0000-000000000003', '18k Gold Plated Sterling Silver'),
('b0000000-0000-0000-0000-000000000302', 'a0000000-0000-0000-0000-000000000003', '925 Sterling Silver'),
('b0000000-0000-0000-0000-000000000303', 'a0000000-0000-0000-0000-000000000003', '100% Organic Cotton');

-- 4. Insert Products
INSERT INTO public.products (id, category_id, name, slug, description, base_price, status) VALUES
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000101', 'Pantheon Earrings', 'pantheon-earrings', 'The Pantheon earrings embody architectural elegance with their clean, geometric design. Inspired by classical Roman architecture, these statement pieces feature a sophisticated interplay of curves and angles that catch and reflect light beautifully.', 2850.00, 'published'),
('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000102', 'Eclipse Bracelet', 'eclipse-bracelet', 'A delicate, fluid bracelet with circular links that sit comfortably against the wrist. Represents the celestial alignment of light and shadow.', 1850.00, 'published'),
('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000201', 'Classic Cotton Tee', 'classic-cotton-tee', 'Crafted from ultra-soft, premium organic cotton, this t-shirt offers a relaxed fit and ultimate comfort for daily casual wear.', 35.00, 'published'),
('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'Wireless Noise-Cancelling Headphones', 'wireless-headphones', 'Immersive acoustics, hybrid active noise cancellation, and a sleek, modern, ergonomic design with up to 40 hours of battery life.', 299.00, 'published');

-- 5. Insert Product Variants
INSERT INTO public.product_variants (id, product_id, sku, price_override, stock_qty) VALUES
-- Pantheon Gold Variant
('e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'JWL-PTH-GLD', NULL, 15),
-- Eclipse Silver Variant
('e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'JWL-ECL-SLV', NULL, 8),
-- T-Shirts (S, M, L, XL in Black/White)
('e0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'CLO-TEE-S-BLK', NULL, 50),
('e0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000003', 'CLO-TEE-M-BLK', NULL, 75),
('e0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000003', 'CLO-TEE-L-WHT', 38.00, 40),
-- Headphones Variant
('e0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000004', 'ELE-HP-BLK', NULL, 20);

-- 6. Link Variants to Attribute Values
INSERT INTO public.variant_attribute_values (variant_id, attribute_value_id) VALUES
-- Pantheon Gold: Gold + 18k Gold Plated
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000203'),
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000301'),
-- Eclipse Silver: Silver + 925 Sterling Silver
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000204'),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000302'),
-- T-Shirt S Black: S + Black + 100% Cotton
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000101'),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000201'),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000303'),
-- T-Shirt M Black: M + Black + 100% Cotton
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000102'),
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000201'),
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000303'),
-- T-Shirt L White: L + White + 100% Cotton
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000103'),
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000202'),
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000303'),
-- Headphone: Black
('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000201');

-- 7. Insert Product Images
INSERT INTO public.product_images (product_id, variant_id, url, alt_text, sort_order) VALUES
('f0000000-0000-0000-0000-000000000001', NULL, '/src/assets/pantheon.jpg', 'Pantheon Earrings Classic Gold', 1),
('f0000000-0000-0000-0000-000000000002', NULL, '/src/assets/eclipse.jpg', 'Eclipse Bracelet Classic Silver', 1),
('f0000000-0000-0000-0000-000000000003', NULL, '/src/assets/organic-earring.png', 'Classic Cotton Tee Hero view', 1);

-- 8. Insert Discounts
INSERT INTO public.discounts (code, type, value, min_order_value, is_active) VALUES
('WELCOME10', 'percentage', 10.00, 50.00, true),
('SAVE50', 'fixed', 50.00, 300.00, true);

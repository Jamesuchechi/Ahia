-- Phase 7: Wishlist table
-- Stores persisted favourites per user.
-- Guests use localStorage only (handled in the hook).

CREATE TABLE IF NOT EXISTS public.wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own wishlist entries
CREATE POLICY "Users can read their own wishlist" ON public.wishlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist" ON public.wishlists
    FOR DELETE USING (auth.uid() = user_id);

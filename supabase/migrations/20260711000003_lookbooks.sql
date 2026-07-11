-- Phase 10: Lookbooks and Curated Collections Tables

CREATE TABLE IF NOT EXISTS public.lookbooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    subtitle text,
    description text,
    cover_image text,
    status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.looks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lookbook_id uuid NOT NULL REFERENCES public.lookbooks(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.look_spots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    look_id uuid NOT NULL REFERENCES public.looks(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    x double precision NOT NULL,
    y double precision NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.lookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.looks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.look_spots ENABLE ROW LEVEL SECURITY;

-- Lookbooks Policies
CREATE POLICY "Anyone can view published lookbooks" ON public.lookbooks
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins have full access on lookbooks" ON public.lookbooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Looks Policies
CREATE POLICY "Anyone can view looks" ON public.looks
    FOR SELECT USING (true);

CREATE POLICY "Admins have full access on looks" ON public.looks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Look Spots Policies
CREATE POLICY "Anyone can view look spots" ON public.look_spots
    FOR SELECT USING (true);

CREATE POLICY "Admins have full access on look spots" ON public.look_spots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

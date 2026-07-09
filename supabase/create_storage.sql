-- Create Storage Bucket for Product Images
-- This script creates the 'product-images' bucket and configures RLS policies
-- so that anyone can read the images, but only authenticated Admins can insert/update/delete.

-- 1. Insert bucket configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policy: Public Read Access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 3. Create Policy: Admin Upload Access
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Create Policy: Admin Update Access
CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'product-images' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Create Policy: Admin Delete Access
CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

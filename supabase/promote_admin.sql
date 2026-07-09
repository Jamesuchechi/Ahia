-- Promote a user to Admin in Ahia
-- Run this script inside the Supabase SQL Editor to elevate a user's permissions.

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  -- Replace the email below with the target user's email address
  SELECT id FROM auth.users WHERE email = 'admin@ahia.shop'
);

-- Alternatively, if you have the user's UUID:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'user-uuid-here';

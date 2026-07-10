-- Run this in Supabase SQL Editor to expose user emails to the admin dashboard.
-- The frontend cannot query auth.users directly with the public anon key.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles AS profile
SET email = auth_user.email
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND profile.email IS DISTINCT FROM auth_user.email;

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

CREATE TRIGGER on_auth_user_email_updated
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email();

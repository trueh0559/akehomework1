
-- Update handle_new_user to support Google OAuth users (use email as fallback display name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name_val TEXT;
  role_val app_role;
BEGIN
  -- Get display name: try metadata, then full_name from Google, then email
  display_name_val := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'ผู้ใช้ใหม่'
  );
  role_val := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user');
  
  -- Create profile (if not exists)
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, display_name_val)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user role (if not exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, role_val)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

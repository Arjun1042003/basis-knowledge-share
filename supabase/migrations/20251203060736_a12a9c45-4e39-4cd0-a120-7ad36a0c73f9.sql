-- Add last_active column to profiles table for tracking user activity
ALTER TABLE public.profiles ADD COLUMN last_active timestamp with time zone DEFAULT now();

-- Create index for efficient querying of active users
CREATE INDEX idx_profiles_last_active ON public.profiles(last_active DESC);

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_active = now()
  WHERE id = auth.uid();
END;
$$;
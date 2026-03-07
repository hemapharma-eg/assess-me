-- Add profiles table and subscription management
-- Run this in the Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    country TEXT,
    job_title TEXT,
    school_university TEXT,
    subscription TEXT DEFAULT 'beta' CHECK (subscription IN ('free', 'beta', 'pro_monthly', 'pro_yearly', 'pro_lifetime')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
CREATE POLICY "Users can manage their own profiles" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- 4. Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, country, job_title, school_university, subscription)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'country',
        new.raw_user_meta_data->>'job_title',
        new.raw_user_meta_data->>'school_university',
        COALESCE(new.raw_user_meta_data->>'subscription', 'beta')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill profiles for existing users if any
INSERT INTO public.profiles (id, subscription)
SELECT id, 'beta' FROM auth.users
ON CONFLICT (id) DO NOTHING;

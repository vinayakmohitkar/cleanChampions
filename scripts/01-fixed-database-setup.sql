-- First, let's make sure we can insert into profiles without the trigger
-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    preferred_area TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('champion', 'worker', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bag_collections table
CREATE TABLE IF NOT EXISTS public.bag_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    champion_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    location_name TEXT NOT NULL,
    bag_count INTEGER NOT NULL CHECK (bag_count > 0),
    area_cleaned TEXT NOT NULL,
    notes TEXT,
    collected BOOLEAN DEFAULT FALSE,
    collected_by UUID REFERENCES public.profiles(id),
    collected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply_requests table
CREATE TABLE IF NOT EXISTS public.supply_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    champion_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('bags', 'gloves', 'both')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bag_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Champions can view their own collections" ON public.bag_collections;
DROP POLICY IF EXISTS "Champions can insert their own collections" ON public.bag_collections;
DROP POLICY IF EXISTS "Workers and admins can view all collections" ON public.bag_collections;
DROP POLICY IF EXISTS "Workers can update collection status" ON public.bag_collections;
DROP POLICY IF EXISTS "Champions can view their own requests" ON public.supply_requests;
DROP POLICY IF EXISTS "Champions can create requests" ON public.supply_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.supply_requests;
DROP POLICY IF EXISTS "Admins can update request status" ON public.supply_requests;

-- Create simplified policies
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on id" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Bag collections policies
CREATE POLICY "Enable read access for authenticated users" ON public.bag_collections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.bag_collections
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.bag_collections
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Supply requests policies
CREATE POLICY "Enable read access for authenticated users" ON public.supply_requests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.supply_requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.supply_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

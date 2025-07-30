-- Drop existing tables and recreate with proper permissions
DROP TABLE IF EXISTS public.supply_requests CASCADE;
DROP TABLE IF EXISTS public.bag_collections CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
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
CREATE TABLE public.bag_collections (
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
CREATE TABLE public.supply_requests (
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

-- Create very permissive policies for now (we can tighten later)
CREATE POLICY "Allow all operations for authenticated users" ON public.profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.bag_collections
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.supply_requests
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.bag_collections TO authenticated;
GRANT ALL ON public.supply_requests TO authenticated;

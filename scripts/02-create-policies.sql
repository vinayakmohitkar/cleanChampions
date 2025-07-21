-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Bag collections policies
CREATE POLICY "Champions can view their own collections" ON public.bag_collections
    FOR SELECT USING (champion_id = auth.uid());

CREATE POLICY "Champions can insert their own collections" ON public.bag_collections
    FOR INSERT WITH CHECK (champion_id = auth.uid());

CREATE POLICY "Workers and admins can view all collections" ON public.bag_collections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND user_type IN ('worker', 'admin')
        )
    );

CREATE POLICY "Workers can update collection status" ON public.bag_collections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND user_type IN ('worker', 'admin')
        )
    );

-- Supply requests policies
CREATE POLICY "Champions can view their own requests" ON public.supply_requests
    FOR SELECT USING (champion_id = auth.uid());

CREATE POLICY "Champions can create requests" ON public.supply_requests
    FOR INSERT WITH CHECK (champion_id = auth.uid());

CREATE POLICY "Admins can view all requests" ON public.supply_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update request status" ON public.supply_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

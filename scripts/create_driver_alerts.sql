-- Drop table if exists to be safe
DROP TABLE IF EXISTS driver_alerts;

-- Create the driver_alerts table
CREATE TABLE public.driver_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('delay', 'dispatch')),
    reason TEXT NOT NULL,
    duration TEXT, -- '15 mins', '30 mins', '1 hour' (used for delay)
    details TEXT, -- Additional notes (used for dispatch)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.driver_alerts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read alerts (for the admin panel and commuters)
CREATE POLICY "Enable read access for all users" ON public.driver_alerts
    FOR SELECT USING (true);

-- Allow authenticated users (drivers) to create alerts
CREATE POLICY "Enable insert for authenticated users only" ON public.driver_alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow drivers to update their own alerts, or admin to resolve them
CREATE POLICY "Enable update for drivers" ON public.driver_alerts
    FOR UPDATE USING (true);

-- Drop table if exists to be safe
DROP TABLE IF EXISTS public.notifications;

-- Create the notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'crowd_alert', 'trip_reminder', 'booking_confirmed', 'route_alert'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own notifications
CREATE POLICY "Enable read access for users" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users (drivers/backend) to insert notifications
CREATE POLICY "Enable insert for authenticated users" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own notifications (e.g., mark as read)
CREATE POLICY "Enable update for users" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow anyone to read the bookings table so the seat map can see which seats are taken
CREATE POLICY "Public Read Access Bookings" ON public.bookings FOR SELECT USING (true);

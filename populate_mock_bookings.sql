-- Temporarily bypass RLS
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Delete any existing bookings to avoid duplicates
DELETE FROM public.bookings;

-- Generate realistic random bookings for each bus based on its current_occupancy
WITH RECURSIVE
seq(n) AS (
    SELECT 1 
    UNION ALL 
    SELECT n+1 FROM seq WHERE n < 50
),
target_buses AS (
    SELECT b.id AS bus_id, t.id AS trip_id, b.current_occupancy, b.total_seats
    FROM buses b
    LEFT JOIN trips t ON t.bus_id = b.id AND t.status IN ('scheduled', 'ongoing')
    WHERE b.current_occupancy > 0
),
seat_assignments AS (
    SELECT
        tb.bus_id,
        tb.trip_id,
        tb.current_occupancy,
        s.n AS seat_number,
        ROW_NUMBER() OVER(PARTITION BY tb.bus_id ORDER BY random()) as rn
    FROM target_buses tb
    CROSS JOIN seq s
    WHERE s.n <= tb.total_seats
),
-- Create a blanket of dates to absorb the Timezone offset! (Yesterday, Today, and Tomorrow)
dates AS (
    SELECT CURRENT_DATE - INTERVAL '1 day' AS travel_date
    UNION ALL SELECT CURRENT_DATE
    UNION ALL SELECT CURRENT_DATE + INTERVAL '1 day'
    UNION ALL SELECT CURRENT_DATE + INTERVAL '2 days'
)
INSERT INTO public.bookings (bus_id, trip_id, seat_number, fare_amount, travel_date, booking_status)
SELECT 
    sa.bus_id, 
    sa.trip_id, 
    sa.seat_number, 
    1500, 
    d.travel_date, 
    'confirmed'
FROM seat_assignments sa
CROSS JOIN dates d
WHERE sa.rn <= sa.current_occupancy;

-- Re-enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

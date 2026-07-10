import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching buses and trips from Supabase...");
  
  // Clean all previous existing generic bookings (optional but keeps things clean)
  console.log("Cleaning old mock bookings...");
  const { error: delErr } = await supabase.from('bookings').delete().is('user_id', null);
  if (delErr) {
    console.log("Could not clear old bookings:", delErr.message);
  }

  const { data: buses, error: busError } = await supabase
    .from('buses')
    .select('*, trips(id, status)')
    .gt('current_occupancy', 0);

  if (busError || !buses) {
    console.error("Error fetching buses:", busError);
    return;
  }

  const travelDate = new Date().toISOString().split('T')[0];
  let totalBookingsInserted = 0;

  for (const bus of buses) {
    const activeTrip = bus.trips?.find((t: any) => t.status === 'scheduled' || t.status === 'ongoing');
    const tripId = activeTrip ? activeTrip.id : null;
    
    const targetOccupancy = bus.current_occupancy;
    const totalSeats = bus.total_seats;

    const availableSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);
    
    // Pick N random unique seats
    const chosenSeats: number[] = [];
    for (let i = 0; i < targetOccupancy; i++) {
        if (availableSeats.length === 0) break;
        const randomIdx = Math.floor(Math.random() * availableSeats.length);
        chosenSeats.push(availableSeats.splice(randomIdx, 1)[0]);
    }

    // Insert bookings directly
    const bookingsToInsert = chosenSeats.map(seat => ({
      bus_id: bus.id,
      trip_id: tripId,
      seat_number: seat,
      travel_date: travelDate,
      booking_status: 'confirmed',
      fare_amount: 1500,
    }));

    if (bookingsToInsert.length > 0) {
      const { error: insertErr } = await supabase.from('bookings').insert(bookingsToInsert);
      if (insertErr) {
        console.error(`Failed to insert bookings for bus ${bus.plate_number}:`, insertErr.message);
      } else {
        totalBookingsInserted += bookingsToInsert.length;
        console.log(`✅ Seeded ${bookingsToInsert.length} actual DB bookings for bus ${bus.plate_number}`);
      }
    }
  }

  console.log(`\n🎉 Success! Inserted ${totalBookingsInserted} realistic mock bookings into the database.`);
  console.log("The Seat Selection UI will now exactly match the DB reality.");
}

main().catch(console.error);

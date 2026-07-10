import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("Fetching routes from Supabase...");
  const { data: routes, error: fetchError } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      origin:hubs!origin_id(latitude, longitude),
      dest:hubs!dest_id(latitude, longitude)
    `);

  if (fetchError || !routes) {
    console.error("Error fetching routes:", fetchError);
    return;
  }

  console.log(`Found ${routes.length} routes. Generating OSRM geometries...`);

  for (const route of routes) {
    const origin = Array.isArray(route.origin) ? route.origin[0] : route.origin;
    const dest = Array.isArray(route.dest) ? route.dest[0] : route.dest;

    if (!origin || !dest) {
      console.log(`Skipping route ${route.id} (${route.route_name}) — missing hubs.`);
      continue;
    }

    const oLng = origin.longitude;
    const oLat = origin.latitude;
    const dLng = dest.longitude;
    const dLat = dest.latitude;

    const url = `http://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?geometries=geojson`;

    try {
      const res = await axios.get(url);
      const osrmRoute = res.data.routes[0];
      if (!osrmRoute) continue;

      const coordinates = osrmRoute.geometry.coordinates; // array of [lng, lat]
      const pathGeoMap = coordinates.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));

      // Update Supabase
      const { error: updateError } = await supabase
        .from('routes')
        .update({ route_path: pathGeoMap })
        .eq('id', route.id);

      if (updateError) {
        console.error(`Failed to update ${route.route_name}:`, updateError.message);
      } else {
        console.log(`✅ Updated ${route.route_name} with ${pathGeoMap.length} points.`);
      }

      // Important: sleep to respect OSRM public API limits (max 1 req/sec is safe)
      await sleep(1500);

    } catch (err: any) {
      console.error(`Failed to fetch geometry for ${route.route_name}:`, err.message);
    }
  }

  console.log("All routes processed successfully!");
}

main().catch(console.error);

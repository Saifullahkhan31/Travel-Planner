/**
 * aiMockData.ts
 *
 * Isolated mock data used EXCLUSIVELY by aiService for AI Suggestion cards.
 * This is intentionally kept separate from the Supabase-backed services so
 * that the AI features continue to work while the ML integration is in progress.
 *
 * DO NOT import MOCK_BUSES or MOCK_ROUTES from mockData.ts anywhere else.
 * When the real AI/ML pipeline is ready, replace these constants with live
 * Supabase queries and remove this file.
 */

import { Bus, Route } from '../types';

// ─── Minimal mock buses needed for AI suggestions only ───────────────────────
export const AI_MOCK_BUSES: Bus[] = [
  {
    id: 'b1', routeId: 'r1', busType: 'AC', totalSeats: 40, currentOccupancy: 14,
    gpsLocation: { latitude: 25.0330, longitude: 67.3200 },
    driverName: 'Ahmed Ali', plateNumber: 'KHI-2341', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'b2', routeId: 'r1', busType: 'Non-AC', totalSeats: 50, currentOccupancy: 38,
    gpsLocation: { latitude: 25.2700, longitude: 68.0100 },
    driverName: 'Usman Khan', plateNumber: 'HYD-5522', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'b3', routeId: 'r2', busType: 'AC', totalSeats: 40, currentOccupancy: 22,
    gpsLocation: { latitude: 25.5200, longitude: 66.7400 },
    driverName: 'Tariq Mehmood', plateNumber: 'QTA-8831', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

// ─── Minimal mock routes needed for AI suggestions only ──────────────────────
export const AI_MOCK_ROUTES: Route[] = [
  {
    id: 'r1', routeName: 'Karachi → Hyderabad',
    origin: 'Karachi', destination: 'Hyderabad',
    stops: [
      { id: 's1_1', routeId: 'r1', name: 'Karachi (Sohrab Goth)',     latitude: 24.9452, longitude: 67.1132, order: 1, estimatedArrival: '08:00' },
      { id: 's1_2', routeId: 'r1', name: 'Toll Plaza (Superhighway)', latitude: 24.9830, longitude: 67.2050, order: 2, estimatedArrival: '08:20' },
      { id: 's1_3', routeId: 'r1', name: 'Kathore',                   latitude: 25.0820, longitude: 67.4400, order: 3, estimatedArrival: '08:50' },
      { id: 's1_4', routeId: 'r1', name: 'Nooriabad',                 latitude: 25.1873, longitude: 67.7516, order: 4, estimatedArrival: '09:15' },
      { id: 's1_5', routeId: 'r1', name: 'Kotri',                     latitude: 25.3630, longitude: 68.3100, order: 5, estimatedArrival: '10:30' },
      { id: 's1_6', routeId: 'r1', name: 'Hyderabad (Qasimabad)',     latitude: 25.3960, longitude: 68.3270, order: 6, estimatedArrival: '10:45' },
    ],
    distance: 163, estimatedDuration: 165, baseFare: 1200, createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'r2', routeName: 'Karachi → Quetta',
    origin: 'Karachi', destination: 'Quetta',
    stops: [
      { id: 's2_1', routeId: 'r2', name: 'Karachi (Layari)', latitude: 24.8750, longitude: 67.0100, order: 1, estimatedArrival: '18:00' },
      { id: 's2_2', routeId: 'r2', name: 'Hub',              latitude: 25.0574, longitude: 66.8900, order: 2, estimatedArrival: '19:00' },
      { id: 's2_3', routeId: 'r2', name: 'Khuzdar',          latitude: 27.8120, longitude: 66.6100, order: 3, estimatedArrival: '01:00' },
      { id: 's2_4', routeId: 'r2', name: 'Quetta',           latitude: 30.1798, longitude: 66.9750, order: 4, estimatedArrival: '06:00' },
    ],
    distance: 686, estimatedDuration: 720, baseFare: 4500, createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'r4', routeName: 'Lahore → Islamabad',
    origin: 'Lahore', destination: 'Islamabad',
    stops: [
      { id: 's4_1', routeId: 'r4', name: 'Lahore (Niazi Express)', latitude: 31.5204, longitude: 74.3587, order: 1, estimatedArrival: '09:00' },
      { id: 's4_2', routeId: 'r4', name: 'Gujranwala',             latitude: 32.1877, longitude: 74.1945, order: 2, estimatedArrival: '09:50' },
      { id: 's4_3', routeId: 'r4', name: 'Rawalpindi',             latitude: 33.5651, longitude: 73.0169, order: 3, estimatedArrival: '12:45' },
      { id: 's4_4', routeId: 'r4', name: 'Islamabad (Faizabad)',   latitude: 33.6844, longitude: 73.0479, order: 4, estimatedArrival: '13:30' },
    ],
    distance: 375, estimatedDuration: 270, baseFare: 3000, createdAt: '2025-01-01T00:00:00Z',
  },
];

// ─── Static GPS waypoints for the map preview on HomeScreen ─────────────────
// These are real highway coordinates along the N-5 (Karachi → Hyderabad).
// Used as a decorative polyline only — not backend data.
export const HOME_MAP_POLYLINE_COORDS = [
  { latitude: 24.9452, longitude: 67.1132 }, // Karachi Sohrab Goth
  { latitude: 24.9830, longitude: 67.2050 }, // Superhighway Toll Plaza
  { latitude: 25.0820, longitude: 67.4400 }, // Kathore
  { latitude: 25.1873, longitude: 67.7516 }, // Nooriabad
  { latitude: 25.3630, longitude: 68.3100 }, // Kotri
  { latitude: 25.3960, longitude: 68.3270 }, // Hyderabad
];

// Static bus marker position for the HomeScreen map preview
export const HOME_MAP_BUS_LOCATION = { latitude: 25.0330, longitude: 67.3200 };

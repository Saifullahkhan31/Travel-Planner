import { Bus, Route, Seat, Booking, Notification, User, TripHistory } from '../types';

// ─── Mock Routes — stops follow actual Pakistani highways ─────────────────────
export const MOCK_ROUTES: Route[] = [
  {
    // N-5 National Highway: Karachi → Hyderabad
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
    // N-25 / RCD Highway: Karachi → Quetta via Hub & Khuzdar
    id: 'r2', routeName: 'Karachi → Quetta',
    origin: 'Karachi', destination: 'Quetta',
    stops: [
      { id: 's2_1', routeId: 'r2', name: 'Karachi (Layari)', latitude: 24.8750, longitude: 67.0100, order: 1, estimatedArrival: '18:00' },
      { id: 's2_2', routeId: 'r2', name: 'Hub',               latitude: 25.0574, longitude: 66.8900, order: 2, estimatedArrival: '19:00' },
      { id: 's2_3', routeId: 'r2', name: 'Winder / Bela',     latitude: 25.9820, longitude: 66.5900, order: 3, estimatedArrival: '21:30' },
      { id: 's2_4', routeId: 'r2', name: 'Khuzdar',           latitude: 27.8120, longitude: 66.6100, order: 4, estimatedArrival: '01:00' },
      { id: 's2_5', routeId: 'r2', name: 'Kalat',             latitude: 29.0230, longitude: 66.5900, order: 5, estimatedArrival: '03:30' },
      { id: 's2_6', routeId: 'r2', name: 'Mastung',           latitude: 29.7980, longitude: 66.8450, order: 6, estimatedArrival: '05:00' },
      { id: 's2_7', routeId: 'r2', name: 'Quetta',            latitude: 30.1798, longitude: 66.9750, order: 7, estimatedArrival: '06:00' },
    ],
    distance: 686, estimatedDuration: 720, baseFare: 4500, createdAt: '2025-01-01T00:00:00Z',
  },
  {
    // N-5: Karachi → Lahore via Hyderabad, Nawabshah, Sukkur, Bahawalpur, Multan
    id: 'r3', routeName: 'Karachi → Lahore',
    origin: 'Karachi', destination: 'Lahore',
    stops: [
      { id: 's3_1', routeId: 'r3', name: 'Karachi',        latitude: 24.9452, longitude: 67.1132, order: 1, estimatedArrival: '12:00' },
      { id: 's3_2', routeId: 'r3', name: 'Hyderabad',      latitude: 25.3960, longitude: 68.3270, order: 2, estimatedArrival: '13:45' },
      { id: 's3_3', routeId: 'r3', name: 'Nawabshah',      latitude: 26.2440, longitude: 68.4100, order: 3, estimatedArrival: '15:30' },
      { id: 's3_4', routeId: 'r3', name: 'Sukkur',         latitude: 27.7139, longitude: 68.8475, order: 4, estimatedArrival: '17:45' },
      { id: 's3_5', routeId: 'r3', name: 'Rahim Yar Khan', latitude: 28.4202, longitude: 70.2950, order: 5, estimatedArrival: '21:00' },
      { id: 's3_6', routeId: 'r3', name: 'Bahawalpur',     latitude: 29.3956, longitude: 71.6836, order: 6, estimatedArrival: '23:30' },
      { id: 's3_7', routeId: 'r3', name: 'Multan',         latitude: 30.1575, longitude: 71.5249, order: 7, estimatedArrival: '01:30' },
      { id: 's3_8', routeId: 'r3', name: 'Lahore',         latitude: 31.5204, longitude: 74.3587, order: 8, estimatedArrival: '06:00' },
    ],
    distance: 1210, estimatedDuration: 1320, baseFare: 8500, createdAt: '2025-01-01T00:00:00Z',
  },
  {
    // GT Road / M-2 Motorway: Lahore → Islamabad via Gujranwala, Jhelum
    id: 'r4', routeName: 'Lahore → Islamabad',
    origin: 'Lahore', destination: 'Islamabad',
    stops: [
      { id: 's4_1', routeId: 'r4', name: 'Lahore (Niazi Express)', latitude: 31.5204, longitude: 74.3587, order: 1, estimatedArrival: '09:00' },
      { id: 's4_2', routeId: 'r4', name: 'Gujranwala',             latitude: 32.1877, longitude: 74.1945, order: 2, estimatedArrival: '09:50' },
      { id: 's4_3', routeId: 'r4', name: 'Gujrat',                 latitude: 32.5738, longitude: 74.0776, order: 3, estimatedArrival: '10:25' },
      { id: 's4_4', routeId: 'r4', name: 'Jhelum',                 latitude: 32.9325, longitude: 73.7258, order: 4, estimatedArrival: '11:15' },
      { id: 's4_5', routeId: 'r4', name: 'Rawalpindi',             latitude: 33.5651, longitude: 73.0169, order: 5, estimatedArrival: '12:45' },
      { id: 's4_6', routeId: 'r4', name: 'Islamabad (Faizabad)',   latitude: 33.6844, longitude: 73.0479, order: 6, estimatedArrival: '13:30' },
    ],
    distance: 375, estimatedDuration: 270, baseFare: 3000, createdAt: '2025-01-01T00:00:00Z',
  },
  {
    // M-1 Motorway: Islamabad → Peshawar via Hasan Abdal, Attock, Nowshera
    id: 'r5', routeName: 'Islamabad → Peshawar',
    origin: 'Islamabad', destination: 'Peshawar',
    stops: [
      { id: 's5_1', routeId: 'r5', name: 'Islamabad (Faizabad)', latitude: 33.6844, longitude: 73.0479, order: 1, estimatedArrival: '07:30' },
      { id: 's5_2', routeId: 'r5', name: 'Hasan Abdal',          latitude: 33.8229, longitude: 72.6934, order: 2, estimatedArrival: '08:10' },
      { id: 's5_3', routeId: 'r5', name: 'Attock',               latitude: 33.8764, longitude: 72.3634, order: 3, estimatedArrival: '08:40' },
      { id: 's5_4', routeId: 'r5', name: 'Nowshera',             latitude: 34.0151, longitude: 71.9747, order: 4, estimatedArrival: '09:30' },
      { id: 's5_5', routeId: 'r5', name: 'Peshawar',             latitude: 34.0151, longitude: 71.5249, order: 5, estimatedArrival: '10:15' },
    ],
    distance: 186, estimatedDuration: 165, baseFare: 1500, createdAt: '2025-01-01T00:00:00Z',
  },
];

// ─── Mock Buses — GPS placed ON their route waypoints ────────────────────────
export const MOCK_BUSES: Bus[] = [
  // r1 Karachi→Hyderabad: between Toll Plaza and Kathore
  { id: 'b1', routeId: 'r1', busType: 'AC',      totalSeats: 40, currentOccupancy: 14, gpsLocation: { latitude: 25.0330, longitude: 67.3200 }, driverName: 'Ahmed Ali',     plateNumber: 'KHI-2341', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  // r1 Karachi→Hyderabad: between Nooriabad and Kotri
  { id: 'b2', routeId: 'r1', busType: 'Non-AC',  totalSeats: 50, currentOccupancy: 38, gpsLocation: { latitude: 25.2700, longitude: 68.0100 }, driverName: 'Usman Khan',    plateNumber: 'HYD-5522', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  // r2 Karachi→Quetta: between Hub and Winder (N-25)
  { id: 'b3', routeId: 'r2', busType: 'AC',      totalSeats: 40, currentOccupancy: 22, gpsLocation: { latitude: 25.5200, longitude: 66.7400 }, driverName: 'Tariq Mehmood', plateNumber: 'QTA-8831', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  // r2 Karachi→Quetta: between Khuzdar and Kalat
  { id: 'b4', routeId: 'r2', busType: 'Premium', totalSeats: 30, currentOccupancy: 8,  gpsLocation: { latitude: 28.4000, longitude: 66.6000 }, driverName: 'Faisal Raza',   plateNumber: 'KHI-1190', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  // r3 Karachi→Lahore: between Sukkur and Rahim Yar Khan
  { id: 'b5', routeId: 'r3', busType: 'Non-AC',  totalSeats: 50, currentOccupancy: 45, gpsLocation: { latitude: 28.0600, longitude: 69.5700 }, driverName: 'Imran Shah',    plateNumber: 'LHR-3375', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  // r4 Lahore→Islamabad: between Gujrat and Jhelum
  { id: 'b6', routeId: 'r4', busType: 'AC',      totalSeats: 40, currentOccupancy: 10, gpsLocation: { latitude: 32.7500, longitude: 73.9200 }, driverName: 'Bilal Hassan',  plateNumber: 'ISB-7742', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  // r5 Islamabad→Peshawar: between Attock and Nowshera
  { id: 'b7', routeId: 'r5', busType: 'Non-AC',  totalSeats: 55, currentOccupancy: 50, gpsLocation: { latitude: 33.9460, longitude: 72.1700 }, driverName: 'Naveed Iqbal',  plateNumber: 'PES-9913', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
];

// ─── Mock Seats Generator ────────────────────────────────────────────────────
function generateSeats(busId: string, totalSeats: number): Seat[] {
  const seats: Seat[] = [];
  const cols = 4;
  const genderZones: Array<'no_preference' | 'female_only' | 'male_only'> = ['female_only', 'female_only', 'no_preference', 'male_only', 'male_only'];
  for (let i = 0; i < totalSeats; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const seatNum = i + 1;
    // Randomize taken seats so gender zones are actually visible and selectable
    const takenProbability = Math.random() < 0.4;
    seats.push({
      id: `seat-${busId}-${seatNum}`,
      busId,
      seatNumber: seatNum,
      seatGenderZone: row < 4 ? 'female_only' : row > (totalSeats/cols)-3 ? 'male_only' : 'no_preference',
      availabilityStatus: !takenProbability,
      position: col === 0 || col === 3 ? 'window' : 'aisle',
      row,
      column: col,
    });
  }
  return seats;
}

export const MOCK_SEATS: Record<string, Seat[]> = {
  b1: generateSeats('b1', 40),
  b2: generateSeats('b2', 50),
  b3: generateSeats('b3', 40),
  b4: generateSeats('b4', 30),
  b5: generateSeats('b5', 50),
  b6: generateSeats('b6', 40),
  b7: generateSeats('b7', 55),
};

// ─── Mock Notifications ──────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'booking_confirmed', title: 'Booking Confirmed!', message: 'Your seat on Karachi → Hyderabad has been confirmed.', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
  { id: 'n2', userId: 'u1', type: 'crowd_alert',       title: 'Crowd Alert 🚨',     message: 'Bus HYD-5522 is getting full. Book your seat now!', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'n3', userId: 'u1', type: 'trip_reminder',     title: 'Trip Reminder',       message: 'Your trip to Lahore departs in 30 minutes.', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'n4', userId: 'u1', type: 'payment_success',   title: 'Payment Successful',  message: 'PKR 1200 paid for Karachi → Hyderabad.', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'n5', userId: 'u1', type: 'trip_reminder',     title: 'Routine Trip Detected', message: 'AI detected your frequent Lahore trip. Want to auto-book?', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

// ─── Mock Trip History ───────────────────────────────────────────────────────
export const MOCK_TRIP_HISTORY: TripHistory[] = [
  { id: 'th1', userId: 'u1', routeId: 'r1', busId: 'b1', travelTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), completionStatus: 'completed', seatSelected: '12A', fareAmount: 1200, routeName: 'Karachi → Hyderabad' },
  { id: 'th2', userId: 'u1', routeId: 'r2', busId: 'b3', travelTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), completionStatus: 'completed', seatSelected: '8B', fareAmount: 4500, routeName: 'Karachi → Quetta' },
  { id: 'th3', userId: 'u1', routeId: 'r1', busId: 'b1', travelTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), completionStatus: 'completed', seatSelected: '5A', fareAmount: 1200, routeName: 'Karachi → Hyderabad' },
];

// ─── Mock User ───────────────────────────────────────────────────────────────
export const MOCK_USER: User = {
  id: 'u1', name: 'Saifullah Khan', email: 'saifullah@iobm.edu.pk',
  phone: '+923001234567', gender: 'male', genderPreference: 'no_preference',
  seatPreference: 'window', busTypePreference: 'AC',
  frequentRoutes: ['r1', 'r3'], area: 'Islamabad',
  occupation: 'student', role: 'commuter', avatarUrl: undefined,
  notifTrips: true, notifCrowd: true, notifBookings: true,
  createdAt: '2025-09-01T00:00:00Z',
};

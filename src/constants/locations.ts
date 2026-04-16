export const PAKISTAN_ROUTES = [
  { id: 'r1', name: 'Karachi → Hyderabad', origin: 'Karachi', destination: 'Hyderabad', distance: 163 },
  { id: 'r2', name: 'Karachi → Quetta',    origin: 'Karachi', destination: 'Quetta',    distance: 686 },
  { id: 'r3', name: 'Karachi → Lahore',    origin: 'Karachi', destination: 'Lahore',    distance: 1210 },
  { id: 'r4', name: 'Lahore → Islamabad',  origin: 'Lahore',  destination: 'Islamabad', distance: 375 },
  { id: 'r5', name: 'Islamabad → Peshawar',origin: 'Islamabad', destination: 'Peshawar', distance: 186 },
];

export const PAKISTAN_CITIES = [
  'Karachi', 'Hyderabad', 'Sukkur', 'Multan', 'Lahore',
  'Faisalabad', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta',
  'Gwadar', 'Sialkot', 'Gujranwala', 'Abbottabad'
];

export const CURRENCY = 'PKR';
export const PHONE_PREFIX = '+92';
export const DEFAULT_LOCATION = { latitude: 30.3753, longitude: 69.3451 }; // Center of Pakistan roughly

export const FARE_CONSTANTS = {
  BASE_FARE    : 500,
  RATE_PER_KM  : 8,
  AC_SURCHARGE : 500,
  PREMIUM_SURGE: 1000,
};

export const CROWD_THRESHOLDS = {
  LOW_MAX   : 40,
  MEDIUM_MAX: 75,
};

export const COMFORT_WEIGHTS = {
  OCCUPANCY_MAX : 50,
  AC_FACTOR     : 50,
  NON_AC_FACTOR : 30,
  PREMIUM_FACTOR: 50,
};

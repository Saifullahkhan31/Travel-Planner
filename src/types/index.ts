// ─── Enumerations ────────────────────────────────────────────────────────────

export type CrowdLevel       = 'low' | 'medium' | 'high';
export type BusType          = 'AC' | 'Non-AC' | 'Premium';
export type GenderPreference = 'no_preference' | 'female_only' | 'male_only';
export type BookingStatus    = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus    = 'pending' | 'success' | 'failed';
export type UserRole         = 'commuter' | 'driver' | 'admin';
export type SeatPosition     = 'window' | 'aisle' | 'front' | 'back';
export type OccupationType   = 'student' | 'professional' | 'worker' | 'other';
export type NotificationType =
  | 'crowd_alert'
  | 'trip_reminder'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_success'
  | 'payment_failed';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface User {
  id                : string;
  name              : string;
  email             : string;
  phone             : string;
  gender            : string;
  genderPreference  : GenderPreference;
  seatPreference    : SeatPosition;
  busTypePreference : BusType;
  frequentRoutes    : string[];
  area              : string;
  occupation        : OccupationType;
  role              : UserRole;
  avatarUrl?        : string;
  notifTrips        : boolean;
  notifCrowd        : boolean;
  notifBookings     : boolean;
  createdAt         : string;
}

export interface Bus {
  id              : string;
  routeId         : string;
  busType         : BusType;
  totalSeats      : number;
  currentOccupancy: number;
  gpsLocation     : GPSCoordinate;
  driverName      : string;
  plateNumber     : string;
  isActive        : boolean;
  createdAt       : string;
}

export interface Route {
  id                : string;
  routeName         : string;
  origin            : string;
  destination       : string;
  stops             : Stop[];
  distance          : number;
  estimatedDuration : number;
  baseFare          : number;
  createdAt         : string;
}

export interface Stop {
  id              : string;
  routeId         : string;
  name            : string;
  latitude        : number;
  longitude       : number;
  order           : number;
  estimatedArrival: string;
}

export interface Seat {
  id                : string;
  busId             : string;
  seatNumber        : number;
  seatGenderZone    : GenderPreference;
  availabilityStatus: boolean;
  position          : SeatPosition;
  row               : number;
  column            : number;
}

export interface Booking {
  id            : string;
  userId        : string;
  busId         : string;
  seatId        : string;
  routeId       : string;
  bookingTime   : string;
  travelDate    : string;
  bookingStatus : BookingStatus;
  paymentStatus : PaymentStatus;
  fareAmount    : number;
  qrCode        : string;
  seatNumber    : number;
  routeName     : string;
  busType       : BusType;
}

export interface TripHistory {
  id               : string;
  userId           : string;
  routeId          : string;
  busId            : string;
  travelTime       : string;
  completionStatus : string;
  seatSelected     : string;
  fareAmount       : number;
  routeName        : string;
}

export interface Payment {
  id             : string;
  bookingId      : string;
  paymentMethod  : string;
  paymentStatus  : PaymentStatus;
  transactionTime: string;
  amount         : number;
}

export interface Notification {
  id       : string;
  userId   : string;
  type     : NotificationType;
  title    : string;
  message  : string;
  isRead   : boolean;
  createdAt: string;
}

export interface GPSCoordinate {
  latitude : number;
  longitude: number;
}

// ─── AI / ML Data Structures ─────────────────────────────────────────────────

export interface CrowdPrediction {
  busId               : string;
  predictedOccupancy  : number;
  crowdLevel          : CrowdLevel;
  occupancyPercentage : number;
  confidenceScore     : number;
  predictedAt         : string;
}

export interface ComfortScore {
  busId          : string;
  score          : number;
  occupancyFactor: number;
  busTypeFactor  : number;
  label          : 'Excellent' | 'Good' | 'Fair' | 'Poor';
  emoji          : '😊' | '🙂' | '😐' | '😟';
  calculatedAt   : string;
}

export interface AITripSuggestion {
  routeId        : string;
  routeName      : string;
  suggestedBusId : string;
  departureTime  : string;
  comfortScore   : ComfortScore;
  crowdPrediction: CrowdPrediction;
  isRoutine      : boolean;
  confidenceScore: number;
  estimatedFare  : number;
  eta            : number;
}

export interface RoutinePattern {
  routeId             : string;
  routeName           : string;
  typicalDepartureTime: string;
  frequency           : number;
  confidenceScore     : number;
  lastDetected        : string;
}

export interface FareEstimate {
  routeId       : string;
  busType       : BusType;
  distance      : number;
  baseFare      : number;
  distanceCharge: number;
  busTypeCharge : number;
  totalFare     : number;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data   : T | null;
  error  : string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data    : T[];
  count   : number;
  page    : number;
  pageSize: number;
  hasMore : boolean;
}

// ─── Navigation Types ────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash        : undefined;
  Onboarding    : undefined;
  Login         : undefined;
  Register      : undefined;
  ForgotPassword: undefined;
  ProfileSetup  : { userId: string };
};

export type HomeStackParamList = {
  Home           : undefined;
  Search         : undefined;
  RouteResults   : { origin: string; destination: string; date: string };
  BusDetail      : { busId: string; routeId: string };
  Notifications  : undefined;
};

export type MapStackParamList = {
  Map               : undefined;
  LiveTracking      : { busId: string; bookingId?: string };
  RouteVisualization: { routeId: string };
};

export type TicketsStackParamList = {
  MyBookings         : undefined;
  ActiveTicket       : { bookingId: string };
  DigitalTicket      : { bookingId: string };
  SeatSelection      : { busId: string; routeId: string; travelDate: string };
  BookingSummary     : { busId: string; seatId: string; routeId: string; travelDate: string };
  QRPayment          : { bookingId: string; fareAmount: number };
  PaymentProcessing  : { bookingId: string; paymentId: string };
  BookingConfirmed   : { bookingId: string };
  BookingCancellation: { bookingId: string };
  TravelHistory      : undefined;
  TripDetail         : { tripId: string };
};

export type AIStackParamList = {
  TravelInsights  : undefined;
  CrowdPrediction : { busId: string; routeId: string };
  ComfortScore    : { busId: string };
  AITripSuggestion: { suggestionData: AITripSuggestion };
};

export type ProfileStackParamList = {
  Profile      : undefined;
  EditProfile  : undefined;
  Preferences  : undefined;
  Settings     : undefined;
  HelpSupport  : undefined;
  PrivacyPolicy: undefined;
};

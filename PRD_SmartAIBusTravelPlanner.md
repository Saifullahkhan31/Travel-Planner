# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Smart AI Bus Travel Planner — Full MVC Build Specification
# Version 1.0 | FYP Session 2025–2026 | IoBM Karachi

---

## ⚡ LLM BUILD INSTRUCTION

You are an expert React Native + TypeScript + Supabase + Python FastAPI developer.
Your task is to build the complete Smart AI Bus Travel Planner mobile application
exactly as specified in this document. This document is the single source of truth.

Follow every specification precisely:
- Every screen, component, service, type, and constant defined here must be implemented
- Never deviate from the design system tokens defined in Section 6
- Never use any technology not listed in Section 4
- Always follow the coding rules in Section 9
- Build in the order specified in Section 11 (Implementation Phases)
- When in doubt, refer back to this document — do not make assumptions

---

## SECTION 1 — PROJECT IDENTITY

```
Application Name : Smart AI Bus Travel Planner
Type             : Cross-platform mobile application
Platform         : iOS + Android (React Native + Expo Managed Workflow)
Target City      : Karachi, Pakistan
Academic Context : Final Year Project (FYP), Session 2025–2026
Institution      : Institute of Business Management (IoBM), Karachi
Department       : College of Computer Science and Information Systems
Supervisor       : Dr. Umme Laila
Team Members     : Alisha Nasir (20221-33353)
                   Saima Batool (20221-33102)
                   Saifullah Khan (20221-33202)
Language         : TypeScript (strict mode throughout)
Theme            : Light mode only
Target Device    : iPhone 16 (393×852px) — primary design reference
```

---

## SECTION 2 — PROBLEM STATEMENT

Inter-city bus commuters in Karachi face the following daily challenges that
this application solves:

1. No visibility into bus crowd levels before boarding
2. No real-time bus location or arrival time information
3. No digital seat reservation system — chaotic manual boarding
4. No gender-zone seating enforcement causing safety concerns for female passengers
5. No predictive travel planning tools — passengers make uninformed decisions
6. Manual paper ticketing with no digital alternative
7. No comfort-based bus selection — passengers cannot compare buses
8. No system that learns travel routines and automates trip planning

---

## SECTION 3 — PRODUCT OVERVIEW

The Smart AI Bus Travel Planner is a mobile application with four primary
functional modules working together:

### Module 1: AI Processing Planner
- Smart trip suggestions based on time, location, and user travel routine
- Crowd level predictions using ML regression (Green/Yellow/Red classification)
- Interactive map showing bus routes, stops, and real-time locations

### Module 2: Real-Time Monitoring and Management
- Live GPS-based bus tracking on interactive map
- Privacy-based occupancy counting via driver input simulation
- AI-derived Comfort Score (0–100) per bus combining occupancy and bus type

### Module 3: Automated Trip Planner and Booking
- Pre-booking: reserve seats in advance
- Seat selection with gender zone preference (female-only, male-only, mixed)
- Dynamic fare estimation based on route distance and bus type
- QR Code digital payment in sandbox mode
- Digital ticket generation with QR verification code

### Module 4: Travel Pattern Learner
- Detects recurring trips from user history (3+ similar trips = routine)
- Continuously updates recommendations as new trips are completed
- Surfaces automated trip suggestions on home screen

---

## SECTION 4 — TECHNOLOGY STACK (MANDATORY — DO NOT SUBSTITUTE)

### 4.1 Frontend
```
Framework        : React Native 0.74+
Workflow         : Expo Managed Workflow (SDK 51+)
Language         : TypeScript 5.x (strict: true in tsconfig)
Navigation       : React Navigation v6
  - @react-navigation/native
  - @react-navigation/native-stack
  - @react-navigation/bottom-tabs
Maps             : react-native-maps + Google Maps SDK
Icons            : @expo/vector-icons (Ionicons set)
Animations       : react-native-reanimated 3.x
Gestures         : react-native-gesture-handler 2.x
QR Generation    : react-native-qrcode-svg + react-native-svg
QR Scanning      : expo-camera + expo-barcode-scanner
Location/GPS     : expo-location
Notifications    : expo-notifications + expo-device
Image Picker     : expo-image-picker
Secure Storage   : expo-secure-store
Async Storage    : @react-native-async-storage/async-storage
HTTP Client      : axios
Date Utilities   : date-fns
Safe Area        : react-native-safe-area-context
URL Polyfill     : react-native-url-polyfill
```

### 4.2 Backend / Database
```
Database         : Supabase (PostgreSQL)
Authentication   : Supabase Auth (email/password + Google OAuth)
Real-time        : Supabase Realtime (WebSocket subscriptions)
Storage          : Supabase Storage (profile images)
Client SDK       : @supabase/supabase-js
```

### 4.3 AI / ML Service
```
Runtime          : Python 3.11+
Framework        : FastAPI
Server           : Uvicorn
ML Library       : Scikit-learn
Data Processing  : Pandas, NumPy
Validation       : Pydantic v2
Environment      : python-dotenv
Supabase Client  : supabase-py
Deployment       : Render.com (free tier) + UptimeRobot (keep-alive)
```

### 4.4 Development Tools
```
Version Control  : Git + GitHub
IDE              : VS Code
Design Reference : Figma (44 screens designed)
Build Tool       : Expo EAS Build (for APK generation)
Package Manager  : npm
Testing          : Jest + React Native Testing Library
```

### 4.5 Environment Variables
```
# All variables must be prefixed EXPO_PUBLIC_ for Expo access
EXPO_PUBLIC_SUPABASE_URL          = your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY     = your_supabase_anon_key
EXPO_PUBLIC_AI_API_URL            = http://localhost:8000 (dev)
                                    https://your-service.onrender.com (prod)
EXPO_PUBLIC_GOOGLE_MAPS_KEY       = your_google_maps_api_key
```

---

## SECTION 5 — USER ROLES AND ACTORS

### Role 1: Commuter (Primary User)
```
Description  : Daily bus users — students, professionals, general passengers
Access       : Full app — all 35 commuter screens
Key Actions  : Search routes, view crowd predictions, book seats,
               pay via QR, track buses, view travel history
```

### Role 2: Bus Driver
```
Description  : Operates bus, provides occupancy updates
Access       : 4 driver-specific screens
Key Actions  : Log in as driver, update bus occupancy,
               view route and schedule, mark trip status
```

### Role 3: System Administrator
```
Description  : Manages backend operations and data
Access       : 5 admin-specific screens
Key Actions  : Manage bus fleet, manage routes,
               update schedules, view system data
```

---

## SECTION 6 — DESIGN SYSTEM (MANDATORY TOKENS — NEVER HARDCODE VALUES)

All design tokens must be defined in constants files and imported everywhere.
Never write hex colors, pixel numbers, or font sizes directly in component files.

### 6.1 Color Tokens — src/constants/colors.ts
```typescript
export const Colors = {
  // App Structure
  background   : '#EEF2F7',  // Every screen background
  card         : '#FFFFFF',  // All card and surface backgrounds

  // Brand
  primary      : '#3B82F6',  // Blue — buttons, links, active states
  primaryTint  : '#EFF6FF',  // Light blue — badge backgrounds, tints

  // Typography
  textPrimary  : '#0F172A',  // Headings, body text, form labels
  textSecondary: '#64748B',  // Subtitles, captions, descriptions
  textMuted    : '#94A3B8',  // Placeholders, hints, disabled text

  // Structure
  border       : '#E2E8F0',  // Input borders, card outlines
  divider      : '#E2E8F0',  // Section separator lines

  // Crowd Status
  success      : '#22C55E',  // Low crowd — Green
  successTint  : '#F0FDF4',  // Low crowd badge background
  warning      : '#F59E0B',  // Medium crowd — Amber
  warningTint  : '#FFFBEB',  // Medium crowd badge background
  error        : '#EF4444',  // High crowd — Red
  errorTint    : '#FEF2F2',  // High crowd badge background

  // Comfort Score
  comfort      : '#F97316',  // Orange ring for comfort score
  comfortTint  : '#FFF7ED',  // Orange tint background

  // Pure
  white        : '#FFFFFF',
  transparent  : 'transparent',
};
```

### 6.2 Spacing Tokens — src/constants/spacing.ts
```typescript
export const Spacing = {
  xs           : 4,
  sm           : 8,
  md           : 12,
  lg           : 16,
  xl           : 20,
  xxl          : 24,
  xxxl         : 32,
  screenPadding: 20,   // Horizontal padding on all screens
  cardPadding  : 16,   // Internal card padding
  safeBottom   : 34,   // iPhone bottom safe area
  sectionGap   : 24,   // Between major screen sections
  itemGap      : 12,   // Between related items
};

export const BorderRadius = {
  sm  : 8,
  md  : 12,
  lg  : 16,
  xl  : 20,
  xxl : 24,
  full: 999,
};
```

### 6.3 Typography Tokens — src/constants/typography.ts
```typescript
export const Typography = {
  h1          : { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  h2          : { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  h3          : { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  h4          : { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary },
  body        : { fontSize: 14, fontWeight: '400' as const, color: Colors.textPrimary },
  bodyMedium  : { fontSize: 14, fontWeight: '500' as const, color: Colors.textPrimary },
  caption     : { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  captionMed  : { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  tiny        : { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
  buttonLabel : { fontSize: 15, fontWeight: '600' as const, color: Colors.white },
  navLabel    : { fontSize: 10, fontWeight: '400' as const },
  sectionLabel: { fontSize: 11, fontWeight: '500' as const,
                  color: Colors.textMuted, letterSpacing: 1.5 },
};
```

### 6.4 Shadow Tokens — src/constants/shadows.ts
```typescript
export const Shadows = {
  card: {
    shadowColor  : '#000000',
    shadowOffset : { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius : 12,
    elevation    : 3,
  },
  button: {
    shadowColor  : Colors.primary,
    shadowOffset : { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius : 12,
    elevation    : 6,
  },
  float: {
    shadowColor  : '#000000',
    shadowOffset : { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius : 20,
    elevation    : 10,
  },
};
```

### 6.5 Standard Component Specifications

#### Primary Button
```
Height          : 52px
Border Radius   : BorderRadius.md (12)
Background      : Colors.primary
Text            : Typography.buttonLabel
Shadow          : Shadows.button
Width           : Full width by default
Active Opacity  : 0.8
Icon Placement  : Left or right of label, 8px gap
```

#### Secondary Button
```
Height          : 52px
Border Radius   : BorderRadius.md (12)
Background      : Colors.white
Border          : 1px solid Colors.border
Text Color      : Colors.textPrimary, 15px medium
Shadow          : Shadows.card
```

#### Input Field
```
Height          : 52px
Border Radius   : BorderRadius.md (12)
Background      : Colors.white
Border default  : 1px solid Colors.border
Border focused  : 1px solid Colors.primary + shadow 0 0 0 3px #3B82F610
Padding         : 0 Spacing.lg
Left Icon Size  : 18px, color Colors.textMuted
Right Icon Size : 18px, color Colors.textMuted (eye toggle etc.)
Placeholder     : Colors.textMuted, Typography.body
```

#### Card Container
```
Background      : Colors.card (#FFFFFF)
Border Radius   : BorderRadius.lg (16)
Shadow          : Shadows.card
Padding         : Spacing.cardPadding (16)
```

#### AI Badge / Pill
```
Background      : Colors.primaryTint (#EFF6FF)
Text Color      : Colors.primary (#3B82F6)
Font            : 12px, weight 500
Border Radius   : BorderRadius.full (999)
Padding         : 4px 10px
Prefix          : '✦ ' sparkle character
```

#### Crowd Level Pills
```
Low    : bg Colors.successTint, text Colors.success, prefix '● '
Medium : bg Colors.warningTint, text Colors.warning, prefix '● '
High   : bg Colors.errorTint,   text Colors.error,   prefix '● '
All    : BorderRadius.full, padding 4px 10px, fontSize 12, weight 500
```

#### Comfort Score Ring
```
Component Type  : Circular progress ring (SVG arc)
Diameter        : 64px (card), 96px (detail screen)
Ring Color      : Colors.comfort (#F97316)
Track Color     : Colors.comfortTint (#FFF7ED)
Ring Width      : 6px
Center Text     : Score number, 18px bold, Colors.textPrimary
Sub Label       : 'Comfort', 10px, Colors.textMuted
```

#### Bottom Navigation Bar
```
Height          : 83px (includes 34px safe area)
Background      : Colors.white
Top Border      : 1px solid Colors.border
Items           : 5 (Home, Map, Tickets, AI Insights, Profile)
Active State    : Icon filled Colors.primary + label Colors.primary
                  + 4px blue dot below icon
Inactive State  : Icon outline Colors.textSecondary
                  + label Colors.textSecondary
Label Font      : Typography.navLabel (10px)
Icon Size       : 22px
```

---

## SECTION 7 — COMPLETE TYPESCRIPT TYPE DEFINITIONS
## File: src/types/index.ts

```typescript
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
  id                  : string;
  name                : string;
  email               : string;
  phone               : string;
  gender              : string;
  genderPreference    : GenderPreference;
  seatPreference      : SeatPosition;
  busTypePreference   : BusType;
  frequentRoutes      : string[];
  area                : string;
  occupation          : OccupationType;
  role                : UserRole;
  avatarUrl?          : string;
  notifTrips          : boolean;
  notifCrowd          : boolean;
  notifBookings       : boolean;
  createdAt           : string;
}

export interface Bus {
  id                  : string;
  routeId             : string;
  busType             : BusType;
  totalSeats          : number;
  currentOccupancy    : number;
  gpsLocation         : GPSCoordinate;
  driverName          : string;
  plateNumber         : string;
  isActive            : boolean;
  createdAt           : string;
}

export interface Route {
  id                  : string;
  routeName           : string;
  origin              : string;
  destination         : string;
  stops               : Stop[];
  distance            : number;         // in kilometers
  estimatedDuration   : number;         // in minutes
  baseFare            : number;         // in PKR
  createdAt           : string;
}

export interface Stop {
  id                  : string;
  routeId             : string;
  name                : string;
  latitude            : number;
  longitude           : number;
  order               : number;
  estimatedArrival    : string;         // ISO datetime
}

export interface Seat {
  id                  : string;
  busId               : string;
  seatNumber          : number;
  seatGenderZone      : GenderPreference;
  availabilityStatus  : boolean;
  position            : SeatPosition;
  row                 : number;
  column              : number;
}

export interface Booking {
  id                  : string;
  userId              : string;
  busId               : string;
  seatId              : string;
  routeId             : string;
  bookingTime         : string;
  travelDate          : string;
  bookingStatus       : BookingStatus;
  paymentStatus       : PaymentStatus;
  fareAmount          : number;
  qrCode              : string;
  seatNumber          : number;
  routeName           : string;
  busType             : BusType;
}

export interface TripHistory {
  id                  : string;
  userId              : string;
  routeId             : string;
  busId               : string;
  travelTime          : string;
  completionStatus    : string;
  seatSelected        : string;
  fareAmount          : number;
  routeName           : string;
}

export interface Payment {
  id                  : string;
  bookingId           : string;
  paymentMethod       : string;
  paymentStatus       : PaymentStatus;
  transactionTime     : string;
  amount              : number;
}

export interface Notification {
  id                  : string;
  userId              : string;
  type                : NotificationType;
  title               : string;
  message             : string;
  isRead              : boolean;
  createdAt           : string;
}

export interface GPSCoordinate {
  latitude            : number;
  longitude           : number;
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
  busId               : string;
  score               : number;         // 0–100
  occupancyFactor     : number;
  busTypeFactor       : number;
  label               : 'Excellent' | 'Good' | 'Fair' | 'Poor';
  emoji               : '😊' | '🙂' | '😐' | '😟';
  calculatedAt        : string;
}

export interface AITripSuggestion {
  routeId             : string;
  routeName           : string;
  suggestedBusId      : string;
  departureTime       : string;
  comfortScore        : ComfortScore;
  crowdPrediction     : CrowdPrediction;
  isRoutine           : boolean;
  confidenceScore     : number;
  estimatedFare       : number;
  eta                 : number;         // minutes until departure
}

export interface RoutinePattern {
  routeId             : string;
  routeName           : string;
  typicalDepartureTime: string;
  frequency           : number;         // times per week
  confidenceScore     : number;
  lastDetected        : string;
}

export interface FareEstimate {
  routeId             : string;
  busType             : BusType;
  distance            : number;
  baseFare            : number;
  distanceCharge      : number;
  busTypeCharge       : number;
  totalFare           : number;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data                : T | null;
  error               : string | null;
  loading             : boolean;
}

export interface PaginatedResponse<T> {
  data                : T[];
  count               : number;
  page                : number;
  pageSize            : number;
  hasMore             : boolean;
}

// ─── Navigation Types ────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash              : undefined;
  Onboarding          : undefined;
  Login               : undefined;
  Register            : undefined;
  ForgotPassword      : undefined;
  ProfileSetup        : { userId: string };
};

export type HomeStackParamList = {
  Home                : undefined;
  Search              : undefined;
  RouteResults        : { origin: string; destination: string; date: string };
  BusDetail           : { busId: string; routeId: string };
  Notifications       : undefined;
};

export type MapStackParamList = {
  Map                 : undefined;
  LiveTracking        : { busId: string; bookingId?: string };
  RouteVisualization  : { routeId: string };
};

export type TicketsStackParamList = {
  MyBookings          : undefined;
  ActiveTicket        : { bookingId: string };
  DigitalTicket       : { bookingId: string };
  SeatSelection       : { busId: string; routeId: string; travelDate: string };
  BookingSummary      : { busId: string; seatId: string; routeId: string; travelDate: string };
  QRPayment           : { bookingId: string; fareAmount: number };
  PaymentProcessing   : { bookingId: string; paymentId: string };
  BookingConfirmed    : { bookingId: string };
  BookingCancellation : { bookingId: string };
};

export type AIStackParamList = {
  TravelInsights      : undefined;
  CrowdPrediction     : { busId: string; routeId: string };
  ComfortScore        : { busId: string };
  AITripSuggestion    : { suggestionData: AITripSuggestion };
};

export type ProfileStackParamList = {
  Profile             : undefined;
  EditProfile         : undefined;
  Preferences         : undefined;
  Settings            : undefined;
  HelpSupport         : undefined;
  PrivacyPolicy       : undefined;
};
```

---

## SECTION 8 — DATABASE SCHEMA (Supabase PostgreSQL)

Run the following SQL exactly in Supabase SQL Editor to create the full schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  phone                TEXT,
  gender               TEXT,
  gender_preference    TEXT DEFAULT 'no_preference'
                       CHECK (gender_preference IN
                         ('no_preference','female_only','male_only')),
  seat_preference      TEXT DEFAULT 'window'
                       CHECK (seat_preference IN
                         ('window','aisle','front','back')),
  bus_type_preference  TEXT DEFAULT 'AC'
                       CHECK (bus_type_preference IN ('AC','Non-AC','Premium')),
  frequent_routes      TEXT[] DEFAULT '{}',
  area                 TEXT,
  occupation           TEXT,
  role                 TEXT DEFAULT 'commuter'
                       CHECK (role IN ('commuter','driver','admin')),
  avatar_url           TEXT,
  notif_trips          BOOLEAN DEFAULT TRUE,
  notif_crowd          BOOLEAN DEFAULT TRUE,
  notif_bookings       BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Routes ──────────────────────────────────────────────────────────────────
CREATE TABLE public.routes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_name           TEXT NOT NULL,
  origin               TEXT NOT NULL,
  destination          TEXT NOT NULL,
  stops                JSONB DEFAULT '[]',
  distance             NUMERIC NOT NULL,
  estimated_duration   INTEGER NOT NULL,
  base_fare            NUMERIC DEFAULT 20,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Buses ───────────────────────────────────────────────────────────────────
CREATE TABLE public.buses (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id             UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  bus_type             TEXT NOT NULL
                       CHECK (bus_type IN ('AC','Non-AC','Premium')),
  total_seats          INTEGER NOT NULL,
  current_occupancy    INTEGER DEFAULT 0,
  gps_location         JSONB DEFAULT '{"latitude": 24.8607, "longitude": 67.0011}',
  driver_name          TEXT,
  plate_number         TEXT,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seats ───────────────────────────────────────────────────────────────────
CREATE TABLE public.seats (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id               UUID REFERENCES public.buses(id) ON DELETE CASCADE,
  seat_number          INTEGER NOT NULL,
  seat_gender_zone     TEXT DEFAULT 'no_preference'
                       CHECK (seat_gender_zone IN
                         ('no_preference','female_only','male_only')),
  availability_status  BOOLEAN DEFAULT TRUE,
  position             TEXT CHECK (position IN ('window','aisle','front','back')),
  row                  INTEGER NOT NULL,
  col                  INTEGER NOT NULL,
  UNIQUE (bus_id, seat_number)
);

-- ─── Bookings ────────────────────────────────────────────────────────────────
CREATE TABLE public.bookings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES public.users(id) ON DELETE CASCADE,
  bus_id               UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  seat_id              UUID REFERENCES public.seats(id) ON DELETE SET NULL,
  route_id             UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  booking_time         TIMESTAMPTZ DEFAULT NOW(),
  travel_date          DATE NOT NULL,
  booking_status       TEXT DEFAULT 'pending'
                       CHECK (booking_status IN
                         ('pending','confirmed','cancelled','completed')),
  payment_status       TEXT DEFAULT 'pending'
                       CHECK (payment_status IN ('pending','success','failed')),
  fare_amount          NUMERIC NOT NULL,
  qr_code              TEXT
);

-- ─── Trip History ────────────────────────────────────────────────────────────
CREATE TABLE public.trip_history (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES public.users(id) ON DELETE CASCADE,
  route_id             UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  bus_id               UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  travel_time          TIMESTAMPTZ NOT NULL,
  completion_status    TEXT DEFAULT 'completed',
  seat_selected        TEXT,
  fare_amount          NUMERIC
);

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id           UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_method       TEXT DEFAULT 'qr_sandbox',
  payment_status       TEXT DEFAULT 'pending'
                       CHECK (payment_status IN ('pending','success','failed')),
  transaction_time     TIMESTAMPTZ DEFAULT NOW(),
  amount               NUMERIC NOT NULL
);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL,
  title                TEXT NOT NULL,
  message              TEXT NOT NULL,
  is_read              BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats          ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can only see their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Buses and routes are public read
CREATE POLICY "Anyone can view buses"
  ON public.buses FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view routes"
  ON public.routes FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view seats"
  ON public.seats FOR SELECT USING (TRUE);

-- ─── Seed Data — Routes ──────────────────────────────────────────────────────
INSERT INTO public.routes
  (route_name, origin, destination, distance, estimated_duration, base_fare)
VALUES
  ('IoBM → Gulshan Chowrangi', 'IoBM', 'Gulshan Chowrangi', 12.5, 35, 45),
  ('IoBM → Saddar',            'IoBM', 'Saddar',            18.2, 50, 65),
  ('IoBM → DHA Phase 5',       'IoBM', 'DHA Phase 5',       8.3,  25, 35),
  ('Gulshan → Saddar',         'Gulshan Chowrangi', 'Saddar', 9.4, 30, 40),
  ('North Karachi → Saddar',   'North Karachi', 'Saddar',   22.1, 65, 75);
```

---

## SECTION 9 — CODING RULES AND STANDARDS

### 9.1 Absolute Rules (Never Violate)
```
1.  TypeScript strict mode — tsconfig must have "strict": true
2.  No 'any' type — use proper types from src/types/index.ts
3.  No inline styles — all styles in StyleSheet.create() at file bottom
4.  No hardcoded colors — always Colors.xxx from constants
5.  No hardcoded spacing numbers — always Spacing.xxx or BorderRadius.xxx
6.  No hardcoded font sizes — always spread Typography.xxx
7.  Functional components only — no class components ever
8.  SafeAreaView from react-native-safe-area-context (NOT from react-native)
9.  TouchableOpacity with activeOpacity={0.7} for all pressable elements
10. Always include both iOS shadow props AND Android elevation
11. KeyboardAvoidingView on every screen with input fields:
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
12. showsVerticalScrollIndicator={false} on all ScrollView and FlatList
13. Always handle loading state, error state, and empty state
14. Never commit .env file — it is gitignored
15. console.log must be removed before any commit
```

### 9.2 File Naming Conventions
```
Screens     : PascalCase + Screen suffix    → LoginScreen.tsx
Components  : PascalCase                    → BusCard.tsx
Hooks       : camelCase + use prefix        → useAuth.ts
Services    : camelCase + Service suffix    → authService.ts
Constants   : camelCase                     → colors.ts
Types       : camelCase                     → index.ts
Utils       : camelCase                     → formatters.ts
```

### 9.3 Component File Structure (Always in this order)
```
1. React and React Native imports
2. Third-party library imports
3. Local imports (navigation, services, hooks, types)
4. Constants imports (Colors, Spacing, Typography)
5. Interface/Props type definition
6. Component function:
   a. useState declarations
   b. useRef declarations
   c. useContext / custom hooks
   d. useEffect hooks
   e. Handler functions (handle prefix)
   f. Render helper functions (render prefix)
   g. return JSX
7. StyleSheet.create() — always at the very bottom
```

### 9.4 Screen Template (Use for every new screen)
```typescript
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';

// SCREEN   : [Screen Name]
// FIGMA    : [Exact Figma frame path]
// ROUTE    : [Navigation route name]
// ROLE     : [commuter | driver | admin]

interface Props {
  navigation?: any;
  route?     : any;
}

export default function ScreenNameScreen({ navigation, route }: Props) {

  // ── State ──────────────────────────────────────────────
  const [loading, setLoading] = useState<boolean>(false);
  const [error,   setError  ] = useState<string | null>(null);

  // ── Effects ────────────────────────────────────────────
  useEffect(() => {
    // initialization logic
  }, []);

  // ── Handlers ───────────────────────────────────────────
  const handleAction = async () => {
    try {
      setLoading(true);
      // action logic
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* screen content */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex           : 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom    : Spacing.safeBottom,
  },
});
```

---

## SECTION 10 — AI ALGORITHMS (Exact Specifications)

### Algorithm 1: Crowd Prediction
```
Input fields  : bus_id, route_id, datetime, current_occupancy, total_seats
ML Models     : RandomForestRegressor (primary), LinearRegression (baseline)
Training Data : Synthetic dataset — time_of_day, day_of_week, route_id,
                historical_occupancy, total_seats

Occupancy Rate = (current_occupancy / total_seats) × 100

Classification:
  0–40%    → crowd_level: 'low',    color: green,  label: 'Low Crowd'
  41–75%   → crowd_level: 'medium', color: amber,  label: 'Medium Crowd'
  76–100%  → crowd_level: 'high',   color: red,    label: 'High Crowd'

Output:
  predicted_occupancy    : int
  crowd_level            : str
  occupancy_percentage   : float
  confidence_score       : float (0.0–1.0)
  predicted_at           : ISO datetime string
```

### Algorithm 2: Comfort Score
```
Formula:
  ComfortScore = (1 - current_occupancy / total_seats) × 50 + bus_type_factor

BusTypeFactor:
  'AC'     → 50
  'Non-AC' → 30
  'Premium'→ 50

Score Range: 0–100
Labels:
  80–100  → label: 'Excellent', emoji: '😊'
  60–79   → label: 'Good',      emoji: '🙂'
  40–59   → label: 'Fair',      emoji: '😐'
  0–39    → label: 'Poor',      emoji: '😟'

Output:
  score            : float
  label            : str
  emoji            : str
  occupancy_factor : float
  bus_type_factor  : int
```

### Algorithm 3: Fare Estimation
```
Formula:
  Fare = base_fare + (distance × rate_per_km) + bus_type_charge

Constants:
  base_fare      = 20 PKR
  rate_per_km    = 5 PKR/km
  bus_type_charge:
    'Non-AC'  → 0 PKR
    'AC'      → 25 PKR
    'Premium' → 50 PKR

Output:
  base_fare        : float
  distance_charge  : float
  bus_type_charge  : float
  total_fare       : float
  currency         : 'PKR'
```

### Algorithm 4: Routine Detection
```
Input    : user_id, trip_history (array of TripHistory objects)

Process:
  1. Group trips by route_id
  2. For each route with 3+ trips:
     a. Extract travel_time hours
     b. Create time slots (±30 minute windows)
     c. Find most frequent time slot
     d. Calculate frequency = trips per week
     e. Calculate confidence = frequency_score × recency_score
  3. Mark as routine if confidence > 0.75

Output (array):
  route_id              : str
  route_name            : str
  typical_departure_time: str (HH:MM)
  frequency             : int (trips per week)
  confidence_score      : float
  last_detected         : ISO datetime
```

### Algorithm 5: Seat Recommendation
```
Input    : bus_id, crowd_level, comfort_score, user_gender_preference,
           user_seat_preference, available_seats[]

Scoring per available seat:
  +30 pts  → seat gender_zone matches user gender_preference
  +25 pts  → seat position matches user seat_preference
  +20 pts  → crowd_level is 'low'
  +15 pts  → comfort_score > 70
  -20 pts  → adjacent seats are occupied when crowd is 'medium'+'high'

Output   : seats sorted by score descending
           top 3 seats flagged as 'recommended'
```

---

## SECTION 11 — COMPLETE SCREEN INVENTORY (44 Screens)

### 11.1 Authentication Flow (6 screens)
```
Screen 01: SplashScreen
  File    : src/screens/auth/SplashScreen.tsx
  Route   : Splash
  Purpose : App entry — 2.5s display then navigate to Onboarding or Home
  Features: App logo, app name, tagline, loading dots, version number
  Logic   : Check if user is logged in → if yes go Home, if no go Onboarding
             Check if first launch → if yes go Onboarding, if no go Login

Screen 02: OnboardingScreen
  File    : src/screens/auth/OnboardingScreen.tsx
  Route   : Onboarding
  Purpose : 3-slide introduction shown only on first app launch
  Features: Slide 1 — AI Predictions (crowd, comfort)
             Slide 2 — Smart Seat Booking (gender zones, QR payment)
             Slide 3 — Real-Time Tracking (live map, alerts, routines)
             Slide indicators, Next/Get Started button, Skip option
             "Already have an account? Log In" on each slide
  Storage : AsyncStorage flag 'hasSeenOnboarding' set to 'true' on completion

Screen 03: RegisterScreen
  File    : src/screens/auth/RegisterScreen.tsx
  Route   : Register
  Purpose : New user account creation
  Features: Google + Apple social sign-up buttons
             Form fields: Full Name, Email, Phone (+92 prefix),
             Password (with strength indicator), Confirm Password
             Gender preference segmented control:
               'No Preference' | 'Female Zone' | 'Male Zone'
             Terms of Service + Privacy Policy checkbox
             "Already have an account? Sign In" link
  Validation: All fields required, email format, phone format (+923XXXXXXXXX),
               password min 8 chars + 1 uppercase + 1 number,
               passwords must match, terms must be accepted
  On Submit: Supabase Auth signUp → insert user row → navigate ProfileSetup

Screen 04: LoginScreen
  File    : src/screens/auth/LoginScreen.tsx
  Route   : Login
  Purpose : Returning user authentication
  Features: Google + Apple social login buttons
             Email field, Password field (eye toggle)
             "Forgot Password?" link below password field
             Remember Me toggle (Keep me signed in)
             "Sign In" primary button
             Biometric login option (fingerprint icon row)
             "Don't have an account? Create one" link
             "Login as Driver or Admin →" ghost link at bottom
  On Submit: Supabase Auth signInWithPassword → navigate Home

Screen 05: ForgotPasswordScreen
  File    : src/screens/auth/ForgotPasswordScreen.tsx
  Route   : ForgotPassword
  Purpose : Password reset via email OTP (2 states)
  State 1 — Enter Email:
    Lock-question icon, header, email input, "Send Verification Code" button
    "← Back to Sign In" link
  State 2 — OTP + New Password:
    Shield icon, masked email display, 6-box OTP input
    "Resend in 0:45" countdown, "Verify Code" button
    New Password + Confirm Password fields (shown after OTP verified)
    "Reset Password" button
  On Submit: Supabase Auth resetPasswordForEmail

Screen 06: ProfileSetupScreen
  File    : src/screens/auth/ProfileSetupScreen.tsx
  Route   : ProfileSetup
  Purpose : Post-registration preference setup (Step 2 of 2)
  Features: Step progress bar (Step 2 of 2 — 100% filled)
             Avatar with upload button (expo-image-picker)
             About You section: area input, occupation pills
               (Student | Professional | Worker | Other)
             Travel Preferences section:
               Seat position 2×2 grid
                 (Window | Aisle | Front | Back)
               Bus type cards (AC | Non-AC)
               Frequent routes — add/remove route chips
             Notifications section:
               Trip Reminders toggle (default: ON)
               Crowd Alerts toggle (default: ON)
               Booking Updates toggle (default: ON)
             "Complete Setup" button + "Skip for now" ghost link
  On Submit: Update user row in Supabase → navigate Home
```

### 11.2 Main App Screens (6 screens)
```
Screen 07: HomeScreen
  File    : src/screens/main/HomeScreen.tsx
  Route   : Home
  Purpose : Main dashboard — primary screen users see after login
  Features:
    Header: Avatar + "Karachi, Pakistan" location + notification bell badge
    Search bar with AI chip → navigates to SearchScreen
    Quick access chips: frequent routes from user profile
    AI Suggestion Card (hero card):
      '✦ AI Suggestion' badge
      Route name (e.g. "IoBM → Gulshan Chowrangi")
      Horizontal route line with stop dots
      Bus details: number, departure time, stop count
      Comfort score ring (right side)
      Crowd level pill + Bus type badge + "Book Now" button
    Live Bus Map Preview:
      Dark map with blue route line + bus icons
      'Live Tracking ON' indicator
      "↗ Full Map" button
    Recommended Buses horizontal scroll list (BusCard components)
    Quick Action Grid: Routes, My Tickets, Crowd Intel, History
    Crowd Alert banner (conditional — shown when relevant)
    Bottom Navigation Bar
  Data    : Fetch from Supabase — buses, routes, AI suggestion from FastAPI

Screen 08: SearchScreen
  File    : src/screens/main/SearchScreen.tsx
  Route   : Search
  Purpose : Search for bus routes by origin and destination
  Features:
    Back button, "Search Routes" header
    From/To input fields with swap button between them
    Date picker (today selected by default)
    Recent searches list (from AsyncStorage)
    Popular routes list
    "Search Buses" primary button
  On Submit: Navigate to RouteResultsScreen with params

Screen 09: RouteResultsScreen
  File    : src/screens/main/RouteResultsScreen.tsx
  Route   : RouteResults
  Purpose : Display list of available buses for searched route
  Features:
    Header with back button + route summary + date
    Filter chips: All | AC | Non-AC | Low Crowd | Best Comfort
    Sort options: Departure Time | Comfort Score | Price
    FlatList of BusCard components
    Each card shows: route, crowd level pill, comfort score ring,
      bus type badge, departure time countdown, fare, arrow button
    Empty state if no buses found
    Loading skeleton while fetching
  Data    : Supabase buses query + AI crowd predictions for each bus

Screen 10: BusDetailScreen
  File    : src/screens/main/BusDetailScreen.tsx
  Route   : BusDetail
  Purpose : Full detail view for a specific bus
  Features:
    Back button, "Bus Details" header, share button
    Bus info card: route, bus number, plate, type, driver
    Large Comfort Score ring with breakdown
    Crowd prediction with confidence bar
    Route visualization mini-map with stops list
    Bus amenities: AC/Non-AC, seats info, estimated arrival
    Gender zone breakdown (visual pie/bar)
    Live location card with "Track Live" button
    Sticky bottom: fare amount + "Select Seat" primary button
  Data    : Supabase bus + route + AI comfort/crowd from FastAPI

Screen 11: NotificationsScreen
  File    : src/screens/main/NotificationsScreen.tsx
  Route   : Notifications
  Purpose : All user notifications in chronological order
  Features:
    Back button, "Notifications" header, "Mark all read" button
    FlatList of notification items grouped by Today / Yesterday / Earlier
    Each item: icon (by type), title, message, time, unread dot
    Swipe to dismiss
    Empty state illustration when no notifications
  Data    : Supabase notifications query ordered by created_at DESC
```

### 11.3 Booking Flow (7 screens)
```
Screen 12: SeatSelectionScreen
  File    : src/screens/booking/SeatSelectionScreen.tsx
  Route   : SeatSelection
  Purpose : Visual seat map for selecting a specific seat
  Features:
    Back button, "Select Your Seat" header
    Bus info summary strip (route, bus type, date)
    Gender zone toggle: No Preference | Female Zone | Male Zone
      (filters visible seats by zone)
    Visual seat map grid (rows × columns):
      Available seats: Colors.successTint with green border
      Booked seats: Colors.border with gray fill (not pressable)
      Selected seat: Colors.primary background white text
      Female zone seats: soft pink tint when not filtered
      Male zone seats: soft blue tint when not filtered
    Legend: Available | Booked | Selected | Female Zone | Male Zone
    AI Recommended seat badge: star icon on top 1-2 recommended seats
    Selected seat summary card (slides up when seat is tapped):
      Seat number, position label, gender zone, comfort indicator
    Sticky bottom: "Confirm Seat" button (disabled until seat selected)
  Data    : Supabase seats for bus_id, seat recommendations from FastAPI

Screen 13: BookingSummaryScreen
  File    : src/screens/booking/BookingSummaryScreen.tsx
  Route   : BookingSummary
  Purpose : Review all booking details before payment
  Features:
    Back button, "Booking Summary" header
    Journey details card:
      Route, date, departure time, seat number, bus type, gender zone
    Passenger details card:
      Name, phone (from user profile)
    Fare breakdown card:
      Base fare, distance charge, bus type charge
      Subtotal, any discounts, Total in bold
    Policy note: "Cancellations allowed up to 2 hours before departure"
    Sticky bottom: Total fare amount + "Proceed to Payment" button
  Data    : Assembled from navigation params + user profile

Screen 14: QRPaymentScreen
  File    : src/screens/booking/QRPaymentScreen.tsx
  Route   : QRPayment
  Purpose : Display QR code for sandbox payment
  Features:
    Back button, "Payment" header
    Payment amount displayed prominently
    Generated QR code (react-native-qrcode-svg) with booking ID encoded
    "Scan this QR to complete payment" instruction
    Payment method selector chips:
      QR Code (default selected) | Wallet | Cash (disabled)
    Timer: "QR expires in 4:59" countdown
    "Simulate Payment Success" button (sandbox mode)
    "Cancel Booking" ghost link
  On Simulate: Navigate to PaymentProcessingScreen

Screen 15: PaymentProcessingScreen
  File    : src/screens/booking/PaymentProcessingScreen.tsx
  Route   : PaymentProcessing
  Purpose : Animated processing screen during payment
  Features:
    Centered animated spinner (react-native-reanimated rotating ring)
    "Processing Payment..." heading
    "Please do not close the app" caption
    Progress steps: Verifying → Processing → Confirming
    Auto-navigate to BookingConfirmedScreen after 2.5 seconds
  Logic   : Update booking payment_status to 'success' in Supabase
             Update seat availability_status to FALSE
             Insert payment record
             Insert booking_confirmed notification

Screen 16: BookingConfirmedScreen
  File    : src/screens/booking/BookingConfirmedScreen.tsx
  Route   : BookingConfirmed
  Purpose : Success confirmation after payment
  Features:
    Animated green checkmark circle (scale animation on mount)
    "Booking Confirmed!" heading
    Booking reference number
    Journey summary: route, date, seat, bus
    Amount paid
    Two CTA buttons:
      "View Digital Ticket" (primary)
      "Back to Home" (secondary)
  Logic   : Clear booking stack on navigation to prevent back

Screen 17: DigitalTicketScreen
  File    : src/screens/booking/DigitalTicketScreen.tsx
  Route   : DigitalTicket
  Purpose : Display digital ticket with QR verification code
  Features:
    Ticket card (styled like a physical ticket with perforation line):
      Header: App logo + "Smart AI Bus Travel Planner"
      Route: Origin → Destination (large, bold)
      Details grid: Date | Time | Seat | Bus Type | Gender Zone
      Passenger name + booking ID
      QR code (64×64) in bottom section
      "Verified Ticket" badge with shield icon
    "Share Ticket" button (expo-sharing)
    "Download" button
    "Track My Bus" button → navigates to LiveTrackingScreen
    "Report Issue" ghost link
```

### 11.4 AI Feature Screens (4 screens)
```
Screen 18: TravelInsightsScreen
  File    : src/screens/ai/TravelInsightsScreen.tsx
  Route   : TravelInsights
  Purpose : AI-powered dashboard for personal travel patterns
  Features:
    "AI Insights" header
    Routine patterns section:
      Detected routines as cards with route + frequency + confidence score
      "Suggest Trip" button on each routine card
    Weekly travel summary: days travelled, routes, total fare
    Most used routes horizontal chart
    Average comfort scores per route as bar indicators
    Crowd trend graph (time of day vs crowd level)
    "Your travel AI is learning..." progress indicator
  Data    : trip_history from Supabase + routine detection from FastAPI

Screen 19: CrowdPredictionScreen
  File    : src/screens/ai/CrowdPredictionScreen.tsx
  Route   : CrowdPrediction
  Purpose : Detailed crowd analysis for a specific bus/route
  Features:
    Back button, "Crowd Analysis" header
    Selected route info strip
    Current crowd level — large colored pill + occupancy percentage
    Predicted occupancy bar (animated fill)
    Confidence score indicator
    Time-based crowd chart: 6AM to 10PM hourly prediction bars
      colored green/amber/red by crowd level
    Best time to travel card: highlights lowest crowd time slot
    Comparison: this bus vs other buses on same route
  Data    : FastAPI /predict/crowd endpoint

Screen 20: ComfortScoreScreen
  File    : src/screens/ai/ComfortScoreScreen.tsx
  Route   : ComfortScore
  Purpose : Detailed comfort score breakdown for a bus
  Features:
    Back button, "Comfort Score" header
    Large comfort score ring (96px) with emoji + label
    Score breakdown cards:
      Occupancy factor (visual bar 0–50)
      Bus type factor (AC vs Non-AC badge + score)
    How score is calculated — collapsible explainer section
    Comparison with other buses on same route
    Comfort history trend (last 7 days for this route)
  Data    : FastAPI /predict/comfort endpoint

Screen 21: AITripSuggestionScreen
  File    : src/screens/ai/AITripSuggestionScreen.tsx
  Route   : AITripSuggestion
  Purpose : Detailed view of an AI-generated trip suggestion
  Features:
    Back button, "AI Suggestion" header with sparkle badge
    "Based on your routine" or "Best match now" sub-label
    Suggested bus card: full detail (route, departure, comfort, crowd)
    Why AI suggested this — 3 reason pills with icons
    Confidence score meter
    Alternative buses section (2 alternatives)
    "Book This Trip" primary button → SeatSelectionScreen
    "Not Now" ghost link
  Data    : AITripSuggestion object passed via navigation params
```

### 11.5 History and Tickets (4 screens)
```
Screen 22: MyBookingsScreen
  File    : src/screens/history/MyBookingsScreen.tsx
  Route   : MyBookings
  Purpose : All user bookings — upcoming and past
  Features:
    "My Bookings" header
    Tab selector: Upcoming | Past | Cancelled
    FlatList of BookingCard components for each tab
    Upcoming cards: route, date, seat, status badge, "View Ticket" + "Cancel" buttons
    Past cards: route, date, seat, completed status, "Rebook" button
    Cancelled cards: route, date, refund status
    Pull to refresh
    Empty state per tab
  Data    : Supabase bookings for current user_id

Screen 23: ActiveTicketScreen
  File    : src/screens/history/ActiveTicketScreen.tsx
  Route   : ActiveTicket
  Purpose : Currently active/upcoming ticket with live tracking
  Features:
    "Your Ticket" header
    Countdown timer to departure (HH:MM:SS)
    Bus live location mini-map
    ETA to user's boarding stop
    Seat and route details
    "Track Live" button → LiveTrackingScreen
    "View Full Ticket" button → DigitalTicketScreen
    Crowd alert if bus is filling up fast
  Data    : Supabase booking + real-time Supabase subscription for bus location

Screen 24: TravelHistoryScreen
  File    : src/screens/history/TravelHistoryScreen.tsx
  Route   : TravelHistory
  Purpose : Complete log of past trips
  Features:
    "Travel History" header
    Summary strip: total trips, total spent, most used route
    Month/year filter picker
    FlatList of trip history items:
      Each item: route, date, seat, fare, completion status
      Tap → TripDetailScreen
    Pull to refresh
    Empty state
  Data    : Supabase trip_history for current user_id

Screen 25: TripDetailScreen
  File    : src/screens/history/TripDetailScreen.tsx
  Route   : TripDetail
  Purpose : Full details of a single completed trip
  Features:
    Back button, "Trip Details" header
    Route card with origin → destination visual
    Trip info: date, time, bus, seat, bus type, fare paid
    Comfort score at time of trip
    Route map snapshot
    "Book Same Route" button
    "Share Trip" ghost link
```

### 11.6 Profile and Settings (6 screens)
```
Screen 26: ProfileScreen
  File    : src/screens/profile/ProfileScreen.tsx
  Route   : Profile
  Purpose : User profile overview
  Features:
    Profile header: avatar + name + area + member since
    Stats row: Total Trips | Routes Used | Total Spent
    Quick links list:
      Edit Profile (chevron)
      Travel Preferences (chevron)
      My Bookings (chevron)
      Notifications Settings (chevron)
      Help & Support (chevron)
      Privacy Policy (chevron)
    "Sign Out" button (secondary, with confirmation alert)
    App version at bottom

Screen 27: EditProfileScreen
  File    : src/screens/profile/EditProfileScreen.tsx
  Route   : EditProfile
  Purpose : Update personal profile information
  Features:
    Avatar with change photo button
    Full Name, Email (disabled), Phone, Area fields
    Occupation pill selector
    "Save Changes" primary button
    Discard changes alert on back press if unsaved changes exist

Screen 28: PreferencesScreen
  File    : src/screens/profile/PreferencesScreen.tsx
  Route   : Preferences
  Purpose : Travel and notification preferences
  Features:
    Seat position 2×2 grid (same as ProfileSetup)
    Bus type cards (AC | Non-AC)
    Gender preference segmented control
    Frequent routes management (add/remove chips)
    Notification toggles: Trip Reminders, Crowd Alerts, Booking Updates
    "Save Preferences" primary button
  On Save: Update user row in Supabase

Screen 29: SettingsScreen
  File    : src/screens/profile/SettingsScreen.tsx
  Route   : Settings
  Purpose : App settings
  Features:
    Account section: Change Password, Linked Accounts (Google/Apple)
    App section: Language (English — non-functional), App Theme (Light — locked)
    Data section: Clear Cache button, Delete Account (danger, with confirmation)
    About section: App Version, Terms of Service, Privacy Policy

Screen 30: HelpSupportScreen
  File    : src/screens/profile/HelpSupportScreen.tsx
  Route   : HelpSupport
  Features:
    Search bar for FAQs
    FAQ accordion sections:
      Booking, Payments, AI Features, Account, App Issues
    Contact options: Email, WhatsApp (mock), In-app chat (mock)
    "Report a Bug" button

Screen 31: PrivacyPolicyScreen
  File    : src/screens/profile/PrivacyPolicyScreen.tsx
  Route   : PrivacyPolicy
  Features:
    ScrollView with formatted privacy policy text sections
    Last updated date
    Data collection, usage, third-party, contact info sections
```

### 11.7 Driver Flow (4 screens)
```
Screen 32: DriverLoginScreen
  File    : src/screens/driver/DriverLoginScreen.tsx
  Purpose : Dedicated login for bus drivers
  Features: Role selector at top (Commuter | Driver | Admin)
             Driver ID + Password fields
             "Driver Login" primary button

Screen 33: DriverDashboardScreen
  File    : src/screens/driver/DriverDashboardScreen.tsx
  Purpose : Driver home — current route and bus status
  Features: Today's route card, current occupancy display
             Quick occupancy update buttons (+5, +10, +20, Full, Custom)
             "Start Trip" / "End Trip" toggle
             Booked passengers count vs walk-ins

Screen 34: OccupancyUpdateScreen
  File    : src/screens/driver/OccupancyUpdateScreen.tsx
  Purpose : Manual occupancy data entry
  Features: Number input for current occupancy
             Quick preset buttons, "Update" button
             Timestamp of last update

Screen 35: RouteScheduleScreen
  File    : src/screens/driver/RouteScheduleScreen.tsx
  Purpose : Driver's route and schedule view
  Features: Today's stops list with ETAs
             Current location indicator
             Delay reporting button
```

### 11.8 Admin Flow (5 screens)
```
Screen 36: AdminLoginScreen
  File    : src/screens/admin/AdminLoginScreen.tsx
  Purpose : Admin authentication
  Features: Role selector, admin email + password fields

Screen 37: AdminDashboardScreen
  File    : src/screens/admin/AdminDashboardScreen.tsx
  Purpose : System overview
  Features: Stats cards — Active Buses, Today's Bookings, Total Users
             Quick actions: Add Bus, Add Route, Update Schedule
             Recent activity feed

Screen 38: ManageBusesScreen
  File    : src/screens/admin/ManageBusesScreen.tsx
  Purpose : CRUD for bus fleet
  Features: FlatList of buses, Add Bus FAB,
             Edit/Delete swipe actions, status toggle

Screen 39: ManageRoutesScreen
  File    : src/screens/admin/ManageRoutesScreen.tsx
  Purpose : CRUD for bus routes
  Features: Routes list, Add Route FAB,
             Edit/Delete, stops management

Screen 40: ScheduleManagementScreen
  File    : src/screens/admin/ScheduleManagementScreen.tsx
  Purpose : Manage bus schedules and timetables
  Features: Calendar view, bus-to-route assignment,
             Time slots management
```

---

## SECTION 12 — REUSABLE COMPONENT SPECIFICATIONS

### 12.1 Common Components — src/components/common/

```
Button.tsx
  Props : label, onPress, variant ('primary'|'secondary'|'ghost'),
          loading?, disabled?, iconLeft?, iconRight?, style?
  Rules : Primary uses Shadows.button, secondary uses Shadows.card,
          ghost has no shadow. Loading shows ActivityIndicator inside.

InputField.tsx
  Props : label, value, onChangeText, placeholder, secureTextEntry?,
          keyboardType?, leftIcon?, rightIcon?, onRightIconPress?,
          error?, editable?, style?
  Rules : Shows error text in Colors.error below field.
          Focused state applies Colors.primary border + glow shadow.

Badge.tsx
  Props : label, variant ('ai'|'low'|'medium'|'high'|'custom'),
          customBg?, customText?, iconLeft?, size ('sm'|'md')
  Rules : Uses design system pill styles per variant exactly.

Card.tsx
  Props : children, style?, onPress?, disabled?
  Rules : Applies Shadows.card + white background + BorderRadius.lg.
          If onPress provided, wraps in TouchableOpacity.

LoadingSpinner.tsx
  Props : size? ('small'|'large'), color?, fullScreen?
  Rules : fullScreen centers over entire screen with semi-transparent overlay.

Divider.tsx
  Props : style?, label? (optional center text)
  Rules : Horizontal 1px line in Colors.divider.

ScreenHeader.tsx
  Props : title, onBack?, rightComponent?, subtitle?
  Rules : Back arrow (if onBack), centered title, optional right action.
```

### 12.2 Feature Cards — src/components/cards/

```
BusCard.tsx
  Props : bus, route, crowdPrediction, comfortScore, onPress
  Shows : Route name, crowd pill, comfort ring, bus type badge,
          departure countdown, fare, arrow CTA

AISuggestionCard.tsx
  Props : suggestion (AITripSuggestion), onBookPress
  Shows : AI badge, route, stop line, comfort ring, crowd pill,
          bus type, departure time, Book Now button
  Style : Blue gradient tint on card left border (3px accent)

ComfortScoreRing.tsx
  Props : score, size ('sm'|'md'|'lg'), showLabel?
  Shows : Circular SVG progress ring, score number, optional label

CrowdPill.tsx
  Props : crowdLevel (CrowdLevel), showDot?
  Shows : Colored pill with level label per design system

BookingCard.tsx
  Props : booking, variant ('upcoming'|'past'|'cancelled'), onPress
  Shows : Route, date, seat, status badge, action buttons per variant

TicketCard.tsx
  Props : booking
  Shows : Full ticket design with perforated line, QR code,
          all journey details, verified badge
```

---

## SECTION 13 — SERVICE LAYER SPECIFICATIONS

### 13.1 Supabase Client — src/services/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage             : AsyncStorage,
      autoRefreshToken    : true,
      persistSession      : true,
      detectSessionInUrl  : false,
    },
  }
);
```

### 13.2 Auth Service — src/services/authService.ts
```
Functions:
  signUp(email, password, userData)
    → supabase.auth.signUp + insert into public.users
    → returns { user, error }

  signIn(email, password)
    → supabase.auth.signInWithPassword
    → returns { session, error }

  signOut()
    → supabase.auth.signOut
    → clear AsyncStorage

  getProfile(userId)
    → SELECT * FROM users WHERE id = userId
    → returns User | null

  updateProfile(userId, updates)
    → UPDATE users SET ... WHERE id = userId
    → returns { data, error }

  resetPassword(email)
    → supabase.auth.resetPasswordForEmail
    → returns { error }
```

### 13.3 Bus Service — src/services/busService.ts
```
Functions:
  getBusesByRoute(routeId)
    → SELECT * FROM buses WHERE route_id = routeId AND is_active = TRUE

  getBusById(busId)
    → SELECT * FROM buses WHERE id = busId

  getSeatsByBus(busId)
    → SELECT * FROM seats WHERE bus_id = busId ORDER BY seat_number

  subscribeToBusLocation(busId, callback)
    → Supabase Realtime subscription on buses.gps_location
    → calls callback with updated GPSCoordinate

  updateOccupancy(busId, occupancy)
    → UPDATE buses SET current_occupancy = occupancy WHERE id = busId
    → Driver only
```

### 13.4 Booking Service — src/services/bookingService.ts
```
Functions:
  createBooking(userId, busId, seatId, routeId, travelDate, fare)
    → INSERT INTO bookings ...
    → UPDATE seats SET availability_status = FALSE WHERE id = seatId
    → returns Booking

  confirmBooking(bookingId)
    → UPDATE bookings SET booking_status = 'confirmed',
        payment_status = 'success' WHERE id = bookingId
    → INSERT INTO payments ...
    → INSERT INTO notifications ...
    → INSERT INTO trip_history ...
    → returns { data, error }

  cancelBooking(bookingId)
    → UPDATE bookings SET booking_status = 'cancelled' WHERE id = bookingId
    → UPDATE seats SET availability_status = TRUE WHERE seat matches
    → returns { data, error }

  getUserBookings(userId, status?)
    → SELECT * FROM bookings WHERE user_id = userId
        AND (booking_status = status OR status IS NULL)
        ORDER BY booking_time DESC

  generateQRCode(bookingId)
    → returns JSON.stringify({ bookingId, timestamp, hash })
    → used by react-native-qrcode-svg as value prop
```

### 13.5 AI Service — src/services/aiService.ts
```
Base URL : process.env.EXPO_PUBLIC_AI_API_URL

Functions:
  predictCrowd(busId, routeId, datetime)
    → POST {AI_BASE_URL}/predict/crowd
    → returns CrowdPrediction

  getComfortScore(busId, currentOccupancy, busType)
    → POST {AI_BASE_URL}/predict/comfort
    → returns ComfortScore

  getTripSuggestions(userId, origin, datetime)
    → POST {AI_BASE_URL}/suggest/trip
    → returns AITripSuggestion[]

  detectRoutines(userId, tripHistory)
    → POST {AI_BASE_URL}/detect/routine
    → returns RoutinePattern[]

  estimateFare(routeId, busType, distance)
    → POST {AI_BASE_URL}/estimate/fare
    → returns FareEstimate

All functions:
  → Use axios with timeout: 10000
  → Return { data, error } wrapper
  → Handle network errors gracefully
  → Fall back to calculated values if AI service is down
```

---

## SECTION 14 — NAVIGATION IMPLEMENTATION

### 14.1 AppNavigator.tsx
```typescript
// Root navigator — decides between Auth and Main based on auth state
// Uses AuthContext to check if session exists
// Shows LoadingSpinner during initial auth state check

export function AppNavigator() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return session ? <MainTabNavigator /> : <AuthNavigator />;
}
```

### 14.2 AuthNavigator.tsx
```typescript
// Stack navigator for all auth screens
// No header on any auth screen (headerShown: false)
// Initial route: Splash

Stack screens in order:
  Splash, Onboarding, Login, Register, ForgotPassword, ProfileSetup
```

### 14.3 MainTabNavigator.tsx
```typescript
// Bottom tab navigator with 5 tabs
// Each tab has its own nested Stack navigator
// Tab bar: white bg, primary active color, 83px height

Tabs:
  Home     → HomeStack
  Map      → MapStack
  Tickets  → TicketsStack
  Insights → AIStack
  Profile  → ProfileStack

Each Stack uses headerShown: false (custom headers in screens)
```

---

## SECTION 15 — PYTHON FASTAPI AI SERVICE

### 15.1 Project Structure
```
ai-service/
├── main.py                  # FastAPI app, CORS config, router registration
├── routers/
│   ├── predict.py           # /predict/crowd, /predict/comfort
│   ├── suggest.py           # /suggest/trip
│   ├── detect.py            # /detect/routine
│   └── estimate.py          # /estimate/fare
├── models/
│   ├── crowd_model.py       # RandomForestRegressor training + prediction
│   ├── comfort_model.py     # Comfort score calculation (formula-based)
│   └── routine_model.py     # Frequency-based pattern detection
├── schemas/
│   └── schemas.py           # Pydantic request/response schemas
├── data/
│   └── generate_dataset.py  # Synthetic training data generator
├── requirements.txt
└── .env
```

### 15.2 API Endpoints
```
GET  /health                 → {"status": "ok", "version": "1.0.0"}

POST /predict/crowd
  Request  : { bus_id, route_id, datetime, current_occupancy, total_seats }
  Response : CrowdPrediction schema

POST /predict/comfort
  Request  : { bus_id, current_occupancy, total_seats, bus_type }
  Response : ComfortScore schema

POST /suggest/trip
  Request  : { user_id, origin, destination, datetime, user_preferences }
  Response : AITripSuggestion[] (max 3)

POST /detect/routine
  Request  : { user_id, trip_history: TripHistory[] }
  Response : RoutinePattern[]

POST /estimate/fare
  Request  : { route_id, bus_type, distance }
  Response : FareEstimate schema
```

### 15.3 main.py Configuration
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Smart AI Bus Travel Planner — AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register all routers
# app.include_router(predict_router, prefix="/predict")
# app.include_router(suggest_router, prefix="/suggest")
# app.include_router(detect_router,  prefix="/detect")
# app.include_router(estimate_router,prefix="/estimate")
```

---

## SECTION 16 — KARACHI-SPECIFIC CONSTANTS

```typescript
// src/constants/karachi.ts

export const KARACHI_ROUTES = [
  { id: 'r1', name: 'IoBM → Gulshan Chowrangi', distance: 12.5 },
  { id: 'r2', name: 'IoBM → Saddar',            distance: 18.2 },
  { id: 'r3', name: 'IoBM → DHA Phase 5',       distance: 8.3  },
  { id: 'r4', name: 'Gulshan → Saddar',          distance: 9.4  },
  { id: 'r5', name: 'North Karachi → Saddar',    distance: 22.1 },
];

export const KARACHI_AREAS = [
  'Gulshan-e-Iqbal', 'DHA', 'Saddar', 'Clifton', 'North Karachi',
  'Korangi', 'Malir', 'Landhi', 'F.B Area', 'Nazimabad',
  'North Nazimabad', 'PECHS', 'Bahadurabad', 'Buffer Zone',
];

export const CURRENCY = 'PKR';
export const PHONE_PREFIX = '+92';
export const DEFAULT_LOCATION = { latitude: 24.8607, longitude: 67.0011 };

export const FARE_CONSTANTS = {
  BASE_FARE     : 20,
  RATE_PER_KM   : 5,
  AC_SURCHARGE  : 25,
  PREMIUM_SURGE : 50,
};

export const CROWD_THRESHOLDS = {
  LOW_MAX    : 40,
  MEDIUM_MAX : 75,
};

export const COMFORT_WEIGHTS = {
  OCCUPANCY_MAX  : 50,
  AC_FACTOR      : 50,
  NON_AC_FACTOR  : 30,
  PREMIUM_FACTOR : 50,
};
```

---

## SECTION 17 — IMPLEMENTATION PHASES

Build in this exact order to ensure dependencies are available:

```
PHASE 1 — Foundation (Week 1)
  1. Initialize Expo project with TypeScript template
  2. Install all dependencies from Section 4.1
  3. Create full folder structure from Section 9
  4. Create all constant files: colors, spacing, typography, shadows, karachi
  5. Create src/types/index.ts with all types from Section 7
  6. Initialize Supabase — run full schema from Section 8
  7. Create supabase.ts service
  8. Set up AppNavigator, AuthNavigator structure (empty screens)

PHASE 2 — Reusable Components (Week 1–2)
  Build all components from Section 12:
  Button, InputField, Badge, Card, LoadingSpinner, Divider, ScreenHeader
  BusCard, AISuggestionCard, ComfortScoreRing, CrowdPill, BookingCard, TicketCard
  Test each component in isolation

PHASE 3 — Authentication Flow (Week 2)
  Build screens 01–06 in order: Splash → Onboarding → Register → Login
  → ForgotPassword → ProfileSetup
  Wire up authService.ts
  Set up AuthContext and useAuth hook
  Test full auth flow end-to-end

PHASE 4 — Main App Screens (Week 3)
  Build screens 07–11: Home → Search → RouteResults → BusDetail → Notifications
  Wire up busService.ts and routeService.ts
  Set up MainTabNavigator with all stacks
  Connect BusCard and AISuggestionCard components to real data

PHASE 5 — Booking Flow (Week 3–4)
  Build screens 12–17 in strict order (dependencies exist between them)
  Wire up bookingService.ts
  Implement QR code generation and simulation
  Test complete booking journey end-to-end

PHASE 6 — Python AI Service (Week 4)
  Set up FastAPI project structure
  Generate synthetic training dataset
  Implement all 5 algorithms from Section 10
  Build all endpoints from Section 15.2
  Deploy to Render.com
  Set up UptimeRobot ping

PHASE 7 — AI Feature Screens (Week 5)
  Build screens 18–21: TravelInsights, CrowdPrediction, ComfortScore, AITripSuggestion
  Wire up aiService.ts to call FastAPI endpoints
  Display AI data in all relevant screens (Home, BusDetail, RouteResults)

PHASE 8 — History and Profile (Week 5–6)
  Build screens 22–31
  Wire up trip history and notifications
  Implement Supabase Realtime subscription for live bus tracking

PHASE 9 — Driver and Admin (Week 6)
  Build screens 32–40
  Wire up occupancy update to Supabase
  Connect driver occupancy updates to commuter crowd predictions

PHASE 10 — Polish and Testing (Week 7–8)
  Add loading states to all async operations
  Add empty states to all lists
  Add error boundaries and error states
  Implement pull-to-refresh on all data screens
  Add haptic feedback on important actions (expo-haptics)
  Run full app on Android and iOS
  Fix layout issues on different screen sizes
  Write unit tests for all AI algorithm functions
  Run User Acceptance Testing (UAT)
  Build production APK with Expo EAS
```

---

## SECTION 18 — ERROR HANDLING STANDARDS

```typescript
// Standard error messages to display in UI

export const ErrorMessages = {
  NETWORK          : 'Network error. Please check your connection.',
  AUTH_INVALID     : 'Invalid email or password.',
  AUTH_EXISTS      : 'An account with this email already exists.',
  SEAT_TAKEN       : 'This seat was just booked by someone else. Please select another.',
  PAYMENT_FAILED   : 'Payment could not be processed. Please try again.',
  BOOKING_FAILED   : 'Booking failed. Please try again.',
  AI_UNAVAILABLE   : 'AI predictions temporarily unavailable.',
  GENERIC          : 'Something went wrong. Please try again.',
  SESSION_EXPIRED  : 'Your session has expired. Please sign in again.',
};

// All service functions return { data: T | null, error: string | null }
// All screens handle: loading=true → spinner, error !== null → error message,
//   data is empty → empty state, data loaded → render content
```

---

## SECTION 19 — TESTING REQUIREMENTS

```
Unit Tests (Jest):
  - All 5 AI algorithm functions with multiple input cases
  - All form validation functions in utils/validators.ts
  - All formatter functions in utils/formatters.ts
  - All service functions (mock Supabase client)

Integration Tests:
  - Auth flow: register → login → logout
  - Booking flow: search → select bus → select seat → pay → confirm
  - AI flow: trigger suggestion → view prediction → book

Manual Test Checklist:
  - Test on Android physical device
  - Test on iOS physical device (or simulator)
  - Test with slow network (throttle in developer tools)
  - Test with offline state
  - Test all form validations
  - Test seat booking conflict (same seat, two users)
  - Test notification delivery
  - Test QR code generation and display
  - Test map rendering and location permissions
```

---

## SECTION 20 — FINAL NOTES FOR LLM

When implementing this PRD:

1. Always start a new file with the Screen Template from Section 9.4
2. Always import constants — never hardcode design values
3. Always use types from Section 7 — never create local interfaces that duplicate them
4. Always implement all three states (loading, error, data) for any screen with async data
5. The booking flow (screens 12–17) is the most critical flow — test it exhaustively
6. The AI service can fall back to formula-based calculation if ML model fails
7. All Karachi route names and area names must match exactly as in Section 16
8. The Supabase schema in Section 8 is the definitive database — never add tables without updating this PRD
9. Design tokens in Section 6 are final — never override them with one-off values
10. Navigation types in Section 7 must be used for all navigation.navigate() calls

Build the complete system exactly as specified.
This document contains everything needed.
Do not ask for clarification — use this document to answer all questions.

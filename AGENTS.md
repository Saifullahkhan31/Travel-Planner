# SmartBusPlanner – AI Agent Guidelines

**SmartBusPlanner** is a React Native Expo app for real-time bus booking with AI-powered crowd & comfort predictions. This guide helps AI agents be immediately productive.

## Quick Start

```bash
npm install
expo start --android  # or --ios / --web
```

**Env vars**: `.env` requires `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Supabase client keys, public-safe).

---

## Architecture & Patterns

### Folder Structure
```
src/
├── screens/        (59 screens by domain: auth/, main/, booking/, ai/, map/, profile/, history/)
├── services/       (Stateless: authService, bookingService, busService, aiService)
├── components/     (Reusable UI: cards, common inputs, modals)
├── context/        (AuthContext – only global state)
├── navigation/     (7 typed stacks; MainTabNavigator is root)
├── types/          (Core entities: User, Bus, Booking, etc.)
├── lib/            (Supabase client)
└── constants/      (Colors, spacing, typography)
```

### State Management
- **Global**: AuthContext (`useAuth()` hook) – user session + profile
- **Local**: `useState` in screens for transient UI state (filters, search input)
- **Persistence**: AsyncStorage for session tokens + user preferences
- **Async**: Services return `{ data, error }` – screens handle setState/error toast

### Data Flow Pattern
```
Screen → useAuth() for user
       → await Service.method() → setState
       → Components render from state
```

Services call Supabase directly; no Redux or complex state machine.

---

## Domain Breakdown

### 1. Authentication (`src/screens/auth/`, `src/services/authService.ts`)
- **Flow**: Splash → Onboarding → Register/Login → ProfileSetup → MainTab
- **Storage**: Session in AsyncStorage via Supabase + auto-refresh
- **Tables**: `auth.users`, `profiles`
- **User Shape**: `{ id, email, phone, name, avatar, genderPreference, seatPreference, busTypePreference, frequentRoutes }`

### 2. Bus Booking (`src/screens/booking/`, `src/services/bookingService.ts`)
- **Flow**: HomeScreen search → RouteResults → BusDetail → SeatSelection → BookingSummary → Payment → Confirmed
- **Seat Logic**: Deterministic gender-based zones (rows 1-4 = female, rows 5-7 = male)
- **QR Ticket**: Regenerates every render (not persisted)—deterministic via `JSON.stringify({ bookingId, timestamp, verified })`
- **Tables**: `bookings`, `seats`, `routes`, `buses`

### 3. AI Features (`src/screens/ai/`, `src/services/aiService.ts`)
- **Crowd Prediction**: Time-based occupancy % + confidence score
- **Comfort Score**: 0-100 calculated from occupancy + bus type
- **Trip Suggestions**: Combines crowd, comfort, fare, + routine detection
- **Routine Detection**: Scans `TripHistory` for frequent routes + typical departure times
- **Fallback**: Mock data if Supabase unreachable (graceful degradation)

### 4. Maps & Tracking (`src/screens/map/`)
- **Live Tracking**: Mock implementation (animates bus position)
- **Route Visualization**: Renders polylines from stop coordinates
- **Bus Markers**: Show real-time positions (mock data currently)
- **Map Tiles**: Uses OpenStreetMap (OSM) via react-native-maps

### 5. Tickets & History (`src/screens/history/`, `src/screens/booking/`)
- **Active Tickets**: Current/upcoming bookings with live tracking
- **Travel History**: Past trips grouped by route
- **Digital Ticket**: QR code display + seat info
- **Notifications**: Reminders + alerts tied to bookings

### 6. Profile & Settings (`src/screens/profile/`)
- **User Preferences**: Gender, seat preference, bus type, frequent routes
- **Notifications**: Toggle alerts, email preferences
- **Help & Support**: FAQ, contact, privacy policy
- **Account**: Password reset, logout

---

## Key Files & Navigation

| File | Purpose |
|------|---------|
| `src/navigation/MainTabNavigator.tsx` | Root 5-tab navigation (Home, Search, AI, Tickets, Profile) |
| `src/navigation/AppNavigator.tsx` | Routes between Auth & Main stacks based on session |
| `src/context/AuthContext.tsx` | Global user session + `useAuth()` hook |
| `src/types/index.ts` | All TypeScript interfaces (User, Bus, Booking, etc.) |
| `src/services/authService.ts` | Auth (signup, login, logout, password reset) |
| `src/services/busService.ts` | Bus & route queries |
| `src/services/bookingService.ts` | Booking CRUD + seat availability |
| `src/services/aiService.ts` | Crowd prediction, comfort scores, suggestions |

---

## Common Tasks & Where to Make Changes

### Add a New Screen
1. Create `src/screens/{domain}/{ScreenName}.tsx`
2. Add to corresponding stack in `src/navigation/{Domain}Stack.tsx`
3. Extend `{Domain}StackParamList` in types if it needs params

### Add a UI Component
1. Create in `src/components/` (common/, cards/, modals/)
2. Export from component folder or inline import
3. Use colors/spacing from `src/constants/`

### Add Backend Logic
1. Add query to appropriate service: `src/services/{busService,bookingService,authService,aiService}.ts`
2. Return `{ data, error }` for consistency
3. Handle errors in calling screen with toast/alert

### Change User Preferences
1. Edit `User` type in `src/types/index.ts`
2. Update `profiles` table in Supabase
3. Persist to AsyncStorage in AuthContext if needed

### Add AI Feature
1. Extend `aiService.ts` with new method
2. Create screen in `src/screens/ai/{Feature}Screen.tsx`
3. Add stack route in `src/navigation/AIStack.tsx`

---

## Critical Gotchas & Conventions

### ⚠️ Supabase/TypeScript
- **FK joins return arrays**: Code casts to `any` + assumes single object at [0]. Risky but intentional.
- **Env vars**: Only `EXPO_PUBLIC_*` prefix leaks to app bundle; keep secrets out.
- **Session persistence**: AsyncStorage is critical; don't remove without reason.

### ⚠️ Platform-Specific
- **Android**: `react-native-maps` needs gradle setup + `<UrlTile>` for OSM tiles.
- **iOS**: Location permission prompts required via expo-location.
- **Gesture Handler**: Imported at `App.tsx` root; don't remove or navigation breaks.

### ⚠️ Seat & Gender Logic
- Rows 1-4 = female zone, rows 5-7 = male (computed client-side).
- Gender-based seat selection is intentional per design; validate against business rules.

### ⚠️ QR Tickets
- Regenerates every render (not persisted in DB).
- Deterministic—same bookingId always produces same QR code.
- Do NOT store raw QR strings; regenerate on demand.

### ⚠️ AI Fallback
- If Supabase unavailable, `aiService` falls back to mock routes.
- Graceful degradation is intentional; don't remove fallback logic.

---

## Testing & Validation

- **No test suite yet** – manual testing via Expo Dev Client required
- **Type checking**: `tsc --noEmit` validates TypeScript (recommended before commits)
- **Golden paths**: Test booking flow end-to-end (search → seat → confirm → QR)

---

## Supabase Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `auth.users` | id, email | Auth managed by Supabase |
| `profiles` | user_id, name, avatar, preferences | User profile + prefs |
| `buses` | id, name, type, capacity, amenities | Bus metadata |
| `routes` | id, from_hub, to_hub, distance, fare | Route definitions |
| `bookings` | id, user_id, bus_id, seat_no, trip_date | Booking records |
| `seats` | id, bus_id, row, col, gender_zone | Seat mappings |
| `trips` | id, route_id, date, departure_time | Trip schedules |

---

## Tips for AI Agents

1. **Check types first**: `src/types/index.ts` documents all entities—read it before touching services.
2. **Use AuthContext**: Always prefer `useAuth()` over local state for user data.
3. **Service consistency**: Return `{ data, error }` from all service methods.
4. **Navigation typing**: Extend `*StackParamList` types for new route params.
5. **Env safety**: Only use `EXPO_PUBLIC_*` vars; never hardcode keys.
6. **Test on device**: Simulator/emulator may miss platform-specific issues.

---

## Links & References

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation Docs](https://reactnavigation.org)
- [Supabase JS SDK](https://supabase.com/docs/reference/javascript)
- [react-native-maps Guide](https://github.com/react-native-maps/react-native-maps)

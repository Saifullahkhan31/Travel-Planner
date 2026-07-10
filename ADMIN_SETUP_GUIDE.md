# SmartBusPlanner Admin Panel - Setup Guide

## Overview

You now have a complete admin web dashboard for managing buses, routes, and users in SmartBusPlanner. The system is split into two parts:

1. **Mobile App** (Expo React Native) - User-facing bus booking app
2. **Web Admin Dashboard** (React + Vite) - Admin management panel

Both share the same Supabase backend.

---

## Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd web
npm install
```

### Step 2: Configure Environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your Supabase credentials (same ones used in the mobile app):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your Supabase project settings.

### Step 3: Create Admin User

Before logging in, you need an admin account. Do one of these:

**Option A: Via Supabase Dashboard (Easiest)**
1. Sign up a user in the mobile app (or create via Supabase Auth)
2. Go to Supabase dashboard → `profiles` table
3. Find the user's row, set `role` = `'admin'`

**Option B: Direct SQL**
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'user-id-here';
```

### Step 4: Run the App

```bash
npm run dev
```

The app opens at `http://localhost:5173`

### Step 5: Login

Use the email/password of the admin user you created:
- Email: admin@example.com (or your test email)
- Password: (the password you set during signup)

---

## What You Get

### ✅ Fully Implemented Features

#### 1. **Bus Management**
- List all buses with key details (type, driver, plate, seats, status)
- Add new bus (select route, type, seats, driver, location)
- Edit bus details
- Delete bus with confirmation
- Real-time validation on form submission

#### 2. **Route Management**
- List all routes with distance, duration, and base fare
- Expandable details showing all stops
- Add new route with multiple stops
- Edit route and reorder stops
- Delete route with cascading delete
- Add/edit/remove stops with coordinates

#### 3. **User Management**
- View all users with email, role, and join date
- Filter by role (Admin / Commuter)
- Promote commuter to admin
- Demote admin to commuter
- Real-time user list updates

#### 4. **Authentication**
- Secure admin login with Supabase Auth
- Role-based access control (only admins can access)
- Session persistence
- Auto-logout protection

---

## Backend Services (Shared)

New services created in `src/services/`:

### `adminBusService.ts`
```typescript
createBus(bus: Partial<Bus>)       // Create new bus
updateBus(busId, updates)          // Edit bus
deleteBus(busId)                   // Delete bus
```

### `adminRouteService.ts`
```typescript
createRoute(route)                 // Create route
updateRoute(routeId, updates)      // Edit route
deleteRoute(routeId)               // Delete route
createStop(stop)                   // Add stop
updateStop(stopId, updates)        // Edit stop
deleteStop(stopId)                 // Delete stop
reorderStops(routeId, stopIds)     // Reorder stops
```

### `authService.ts` (Extended)
```typescript
createAdminAccount(email, password, name)  // Admin signup
promoteUserToAdmin(userId)                 // Promote user
demoteAdminToUser(userId)                  // Demote admin
```

---

## Web App Structure

```
web/
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Routes + auth guard
│   ├── context/
│   │   └── AdminAuthContext.tsx     # Auth state + session
│   ├── services/
│   │   └── adminAuthService.ts      # Login/logout logic
│   ├── lib/
│   │   └── supabaseClient.ts        # Supabase initialization
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Admin login
│   │   ├── DashboardScreen.tsx      # Main dashboard
│   │   ├── BusManagementScreen.tsx  # Bus list + CRUD
│   │   ├── BusFormModal.tsx         # Bus form
│   │   ├── RouteManagementScreen.tsx # Route list + CRUD
│   │   ├── RouteFormModal.tsx       # Route form with stops
│   │   └── UserManagementScreen.tsx # User list + role mgmt
│   └── styles/
│       └── globals.css              # Tailwind + custom
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind config
├── vite.config.ts               # Vite config
└── README.md                    # Full documentation
```

---

## Testing the Admin Panel

### Test Flow: Add a Bus

1. **Login** → Use admin credentials
2. **Navigate** → Click "Buses" tab
3. **Add Bus** → Click "Add Bus" button
4. **Fill Form**:
   - Route: Select from dropdown
   - Type: AC/Non-AC/Premium
   - Seats: 40
   - Driver: "Ahmed Ali"
   - Plate: "KHI-2341"
   - GPS: Leave defaults or change
5. **Submit** → Bus appears in table
6. **Verify** → Check mobile app sees new bus (refresh)

### Test Flow: Add a Route

1. **Navigate** → Routes tab
2. **Add Route** → Click "Add Route"
3. **Fill Route**:
   - Name: "Karachi → Hyderabad"
   - Origin: "Karachi"
   - Destination: "Hyderabad"
   - Distance: 163 km
   - Duration: 165 min
   - Fare: 1200 Rs
4. **Add Stops** (inside form):
   - Stop 1: "Karachi Terminal" (25.0330, 67.3200)
   - Stop 2: "Highway Rest" (25.5, 68.0)
   - Stop 3: "Hyderabad Hub" (25.3968, 68.3645)
5. **Submit** → Route with stops created
6. **Verify** → Stops appear when route is expanded

### Test Flow: Promote User

1. **Navigate** → Users tab
2. **Filter** → "Commuters"
3. **Promote** → Click "Promote" button on any user
4. **Verify** → User's role changes to Admin
5. **Login** → That user can now access admin dashboard

---

## Common Issues & Solutions

### "Admin access required" on login
**Problem:** User role isn't set to 'admin'  
**Solution:** 
1. Go to Supabase dashboard
2. Find user in `profiles` table
3. Set `role = 'admin'`

### Can't load buses/routes
**Problem:** Supabase connection issue  
**Solution:**
1. Verify `.env.local` has correct URL and key
2. Check Supabase RLS policies allow authenticated reads
3. Check network tab in browser dev tools for errors

### Changes not appearing
**Problem:** Caching or stale data  
**Solution:**
1. Refresh the page (F5)
2. Check browser console for errors
3. Verify changes in Supabase dashboard directly

### Port 5173 already in use
**Problem:** Another app using port  
**Solution:**
```bash
npm run dev -- --port 5174  # Use different port
```

---

## Next Steps & Enhancements

### Phase 1 (Current) ✅
- [x] Bus CRUD
- [x] Route CRUD with stops
- [x] User role management
- [x] Admin authentication

### Phase 2 (Future)
- [ ] Dashboard statistics (occupancy %, revenue, active trips)
- [ ] Driver management
- [ ] Schedule/trip management
- [ ] Analytics and reports
- [ ] Bulk import (CSV upload)
- [ ] Notification management

### Phase 3 (Production)
- [ ] Deployment (Vercel, Netlify, AWS)
- [ ] Email alerts for admins
- [ ] Audit logs (who changed what)
- [ ] Two-factor authentication
- [ ] Mobile app update notifications

---

## Deployment

### Build for Production

```bash
npm run build  # Creates /dist folder
npm run preview  # Test production build locally
```

### Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm run build
# Then drag /dist folder to Netlify
```

### Self-Host

Use any Node.js hosting:
- AWS EC2
- DigitalOcean
- Heroku
- Railway
- Render

---

## Supabase Setup (RLS Policies)

The admin services have role checks built in, but ensure Supabase RLS policies are set:

```sql
-- Buses table: Admins can write, everyone can read
CREATE POLICY "admin_write_buses" ON buses
FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Routes table: Admins can write
CREATE POLICY "admin_write_routes" ON routes
FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Stops table: Admins can write
CREATE POLICY "admin_write_stops" ON stops
FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

---

## Questions?

Refer to the full documentation in `/web/README.md` for detailed API docs and examples.

Happy admin-ing! 🎉

# Quick Commands Reference

## Mobile App Setup

```bash
# From project root (SmartBusPlanner/)
npm install
expo start
expo start --android  # or --ios or --web
```

---

## Admin Web App Setup

```bash
# From project root, navigate to web
cd web

# First time setup
npm install
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials

# Development
npm run dev          # Starts at http://localhost:5173

# Type checking
npm run lint         # Run TypeScript validation

# Production
npm run build        # Creates /dist folder
npm run preview      # Test production build locally
```

---

## Supabase (Database)

### Create First Admin User

**Via Dashboard:**
1. Go to Supabase project
2. Navigate to `Auth` → `Users`
3. Find the user who should be admin
4. Go to `profiles` table
5. Update that user's `role` column to `'admin'`

**Via SQL:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

### Check RLS Policies

```sql
-- View existing policies
SELECT * FROM pg_policies WHERE tablename IN ('buses', 'routes', 'stops', 'profiles');

-- Enable RLS
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
```

---

## Environment Variables

### Mobile App `.env`
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Web App `web/.env.local`
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## File Structure

```
SmartBusPlanner/
├── src/                          # Mobile app
│   ├── services/
│   │   ├── adminBusService.ts    # NEW - Bus CRUD
│   │   ├── adminRouteService.ts  # NEW - Route/Stop CRUD
│   │   └── authService.ts        # EXTENDED - Admin methods
│   └── ...
├── web/                          # NEW - Admin dashboard
│   ├── src/
│   │   ├── screens/              # UI screens
│   │   ├── services/             # API services
│   │   ├── context/              # Auth context
│   │   └── lib/                  # Utilities
│   ├── package.json
│   └── README.md
├── ADMIN_SETUP_GUIDE.md          # NEW - Setup instructions
├── IMPLEMENTATION_SUMMARY.md     # NEW - What was built
└── AGENTS.md                     # Codebase overview
```

---

## Common Tasks

### Add a New Bus
1. Go to http://localhost:5173/dashboard
2. Login with admin account
3. Click "Buses" tab
4. Click "Add Bus"
5. Fill form (route, type, driver, plate)
6. Save

### Add a New Route
1. Click "Routes" tab
2. Click "Add Route"
3. Fill route details (name, origin, destination, distance, duration, fare)
4. Add stops (click "Add Stop", enter name + coordinates)
5. Save

### Promote User to Admin
1. Click "Users" tab
2. Find the user in the list
3. Click "Promote" button
4. User can now access admin panel

### Restart Dev Server
```bash
# If something isn't working
cd web
npm run dev
```

---

## Troubleshooting

**"Cannot find module" errors**
```bash
cd web
rm -rf node_modules
npm install
```

**Port 5173 already in use**
```bash
npm run dev -- --port 5174
```

**Supabase connection fails**
- Check `.env.local` has correct URL and key
- Verify no typos in environment variables
- Restart dev server after changing env vars

**Can't login to admin**
- Verify user role is 'admin' in Supabase
- Check credentials are correct
- Ensure user email/password exist in `auth.users`

**Changes not showing up**
- Refresh the page (F5)
- Check browser console for errors (F12)
- Verify changes in Supabase dashboard directly

---

## Useful Links

- **Supabase Dashboard**: https://app.supabase.com
- **Vite Docs**: https://vitejs.dev
- **Tailwind Docs**: https://tailwindcss.com
- **React Router**: https://reactrouter.com

---

## Production Deployment

### Build
```bash
cd web
npm run build
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
- Build: `npm run build`
- Publish: `/dist`

---

## Notes

- Mobile app runs on Expo (iOS/Android/Web)
- Admin web app runs on Vite (desktop browser only)
- Both use same Supabase backend
- Admin role is managed via `profiles.role` column
- All CRUD operations check `role: 'admin'` server-side

---

Questions? See ADMIN_SETUP_GUIDE.md for detailed instructions.

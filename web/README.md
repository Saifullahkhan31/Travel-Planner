# SmartBusPlanner Admin Dashboard

Web-based admin panel for managing buses, routes, and users in SmartBusPlanner.

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Same Supabase project as the mobile app

### Setup

1. **Copy environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Add your Supabase credentials to `.env.local`:**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Features

### ✅ Implemented
- **Admin Authentication**: Email/password login with role-based access control
- **Bus Management**: Create, read, update, delete buses
- **Dashboard**: Tab-based navigation between features

### 🔄 In Progress
- Route Management (create, edit, delete routes with stops)
- User Management (promote users to admin, role management)

### 📋 Features Structure

| Tab | Status | Features |
|-----|--------|----------|
| **Buses** | ✅ Complete | List all buses, add new bus, edit details, delete bus |
| **Routes** | 🔄 Partial | (Coming soon) |
| **Users** | 🔄 Partial | (Coming soon) |

## Admin Requirements

To access the admin dashboard:
1. User must have `role: 'admin'` in Supabase `profiles` table
2. Use email/password credentials registered in Supabase `auth.users`

### Creating First Admin User

1. Create a user account in the mobile app OR via Supabase dashboard
2. In Supabase, update the user's profile to set `role = 'admin'`
3. Login to the web dashboard with that account

## Tech Stack

- **React** 19.1.0
- **TypeScript** 5.9.2
- **Vite** 5.0.0
- **Tailwind CSS** 3.3.0
- **Supabase JS SDK** 2.103.3
- **React Router** 6.20.0
- **Lucide Icons** (UI icons)

## File Structure

```
web/src/
├── main.tsx              # React entry point
├── App.tsx               # Routes and auth guard
├── context/
│   └── AdminAuthContext.tsx    # Auth state management
├── services/
│   └── adminAuthService.ts     # Auth API calls
├── lib/
│   └── supabaseClient.ts       # Supabase initialization
├── screens/
│   ├── LoginScreen.tsx         # Login page
│   ├── DashboardScreen.tsx     # Main dashboard
│   ├── BusManagementScreen.tsx # Bus list and CRUD
│   └── BusFormModal.tsx        # Bus form (add/edit)
└── styles/
    └── globals.css             # Tailwind + custom styles
```

## Development Notes

- **Authentication**: Uses Supabase Auth with role-based access control
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context for auth + local useState in components
- **Shared Services**: Uses same Supabase backend as mobile app
- **Admin Checks**: All CRUD operations verify `role: 'admin'` server-side

## Next Steps

1. Complete Route Management screen with stop management
2. Complete User Management screen with role promotion
3. Add more dashboard statistics (occupancy, revenue, etc.)
4. Add search/filter functionality
5. Deploy to hosting (Vercel, Netlify, or self-hosted)

## Troubleshooting

**"Admin access required" error on login:**
- Verify user's `role` is set to `'admin'` in Supabase `profiles` table
- Ensure using correct Supabase credentials in `.env.local`

**CORS errors:**
- Check Supabase project URL matches in environment variables
- Ensure web domain is whitelisted in Supabase project settings

**Buses/routes not loading:**
- Check Supabase RLS policies allow reading by authenticated users
- Verify admin user is authenticated and has correct role

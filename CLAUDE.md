# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a drone rental management system built with Next.js 15, using SQLite with Prisma ORM for database management. The system handles user authentication, equipment management, and rental workflows with role-based access control.

## Development Commands

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Start production server:**
```bash
npm start
```

**Lint code:**
```bash
npm run lint
```

**Database operations:**
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Apply database migrations
npx prisma db push

# Seed database with initial data
npm run db:seed

# Open Prisma Studio for database inspection
npx prisma studio
```

## Architecture

### Authentication & Authorization
- Uses NextAuth.js with JWT strategy and Prisma adapter
- Custom credentials provider with bcrypt password hashing
- Role-based access control: `ADMIN` and `EMPLOYEE` roles
- User approval system (users must be approved by admin before login)
- Auth configuration: `src/lib/auth.ts`
- Middleware protection: `src/middleware.ts`

### Database Schema (Prisma)
Core entities:
- **User**: Authentication with role-based permissions
- **Equipment**: Drone/equipment inventory with status tracking
- **Rental**: Booking system linking users to equipment
- **Account/Session**: NextAuth.js session management

Key relationships:
- Users can have multiple rentals
- Equipment can have multiple rental history records
- Rental status workflow: PENDING → APPROVED/REJECTED → ACTIVE → COMPLETED

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── equipment/     # Equipment CRUD
│   │   └── rentals/       # Rental management
│   ├── admin/             # Admin dashboard pages
│   ├── auth/              # Auth pages (signin/signup)
│   └── dashboard/         # User dashboard
├── components/            # Reusable React components
│   └── ui/               # UI component library
├── lib/                  # Shared utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client setup
│   └── utils.ts          # General utilities
├── types/                # TypeScript definitions
└── middleware.ts         # Route protection
```

### UI Components
Custom UI components in `src/components/ui/`:
- Button, Card, Badge, Input components
- Uses Tailwind CSS with custom design tokens
- Follows consistent styling patterns

### API Design
RESTful API routes with role-based access control:
- `/api/auth/*` - Authentication (public)
- `/api/equipment` - Equipment management (authenticated)
- `/api/rentals` - Rental operations (authenticated)
- `/api/admin/*` - Admin operations (admin only)

## Environment Setup

Required environment variables:
- `DATABASE_URL` - SQLite database file path
- `NEXTAUTH_SECRET` - JWT signing secret
- `NEXTAUTH_URL` - Application URL for NextAuth

## Development Notes

### Database Changes
When modifying the Prisma schema:
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update the client
4. Update seed file if needed: `prisma/seed.ts`

### Authentication Flow
- New users register but require admin approval
- Custom sign-in page at `/auth/signin`
- Middleware protects `/admin/*` and `/dashboard/*` routes
- JWT tokens include user role for authorization

### Styling
- Uses Tailwind CSS with custom design system
- CSS custom properties defined in `src/app/globals.css`
- Component styling follows consistent patterns

### TypeScript
- Strict TypeScript configuration
- Path aliasing: `@/*` maps to `src/*`
- Custom type definitions in `src/types/`

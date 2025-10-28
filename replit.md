# Vietnamese Government Feedback Management System

## Overview

This is a feedback management system built for the Bắc Ninh Provincial Administrative Service Center in Vietnam. The application allows government units to submit feedback, issues, and suggestions, which can then be tracked, assigned, and resolved by administrators. The system uses AI (Google Gemini) to generate automated notification messages in Vietnamese when new feedback is received.

**Core Features:**
- Public feedback submission with Vietnamese language support
- Admin authentication for managing feedback
- Status tracking (Received, Processing, Resolved)
- Assignment system for distributing work
- Real-time statistics dashboard
- AI-generated notification messages using Google Gemini
- Material Design-influenced UI with shadcn/ui components

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 19 with TypeScript and Vite as the build tool

**UI Component System:** shadcn/ui (Radix UI primitives) with Tailwind CSS
- Design system based on Material Design principles
- Custom color scheme with HSL color variables for theming
- Responsive layouts using Tailwind's grid and flexbox utilities
- Component library includes dialogs, forms, cards, badges, toasts, and more

**State Management:**
- TanStack Query (React Query) for server state management
- React hooks for local component state
- No global state management library (Redux, Zustand, etc.)

**Routing:** Wouter for client-side routing (lightweight alternative to React Router)

**Form Handling:** React Hook Form with Zod schema validation

**Styling Approach:**
- Tailwind CSS utility-first styling
- Custom CSS variables for consistent theming
- Inter font family from Google Fonts
- Responsive breakpoints (mobile-first)

### Backend Architecture

**Server Framework:** Express.js with TypeScript

**API Design:** RESTful API with the following endpoints:
- `POST /api/admin/login` - Admin authentication
- `GET /api/feedbacks` - Retrieve all feedback items
- `GET /api/feedbacks/:id` - Retrieve single feedback
- `POST /api/feedbacks` - Create new feedback
- `PATCH /api/feedbacks/:id/status` - Update feedback status
- `PATCH /api/feedbacks/:id/assign` - Assign feedback to user

**Data Layer:**
- Drizzle ORM for database operations
- PostgreSQL database (configured via `@neondatabase/serverless`)
- In-memory storage fallback (`MemStorage` class) for development
- Schema defined with Drizzle's pgTable

**Session Management:** 
- `connect-pg-simple` for PostgreSQL-backed sessions
- Session storage configuration present but authentication uses simple password verification

**Development Setup:**
- Vite middleware integration for hot module replacement
- Development and production build configurations
- ESBuild for server-side bundling

### Data Storage

**Database:** PostgreSQL via Neon serverless driver

**Schema Structure:**
```typescript
feedbacks table:
- id (varchar, primary key, auto-generated UUID)
- unitName (text) - Name of submitting government unit
- title (text) - Feedback title
- description (text) - Detailed feedback description
- imageUrl (text, nullable) - Optional image attachment
- submittedAt (timestamp) - Submission timestamp
- status (text) - Current status: received/processing/resolved
- assignee (text, nullable) - Assigned staff member
```

**ORM Features:**
- Drizzle Kit for migrations (migrations stored in `/migrations`)
- Type-safe query building
- Zod schema validation integration via `drizzle-zod`

### External Dependencies

**Google Gemini AI Integration:**
- Package: `@google/genai` (v1.27.0)
- Model: `gemini-2.5-flash`
- Purpose: Generate professional Vietnamese notification messages when feedback is submitted
- Configuration: Requires `GEMINI_API_KEY` environment variable
- Service location: `server/services/gemini.ts`

**Authentication:**
- Simple password-based admin authentication
- Password stored in `ADMIN_PASSWORD` environment variable
- No JWT or session tokens - basic verification only
- Service location: `server/services/auth.ts`

**Database Connection:**
- Neon PostgreSQL serverless database
- Connection string via `DATABASE_URL` environment variable
- Drizzle ORM handles connection pooling

**UI Component Libraries:**
- Multiple Radix UI primitives (@radix-ui/react-*)
- date-fns for date formatting with Vietnamese locale support
- Lucide React for icons
- cmdk for command palette functionality

**Development Tools:**
- Vite plugins for Replit integration (@replit/vite-plugin-*)
- TypeScript for type safety
- PostCSS with Tailwind and Autoprefixer
# Flow CRM

## Overview

A CRM (Customer Relationship Management) web application for managing sales leads. Built with React, Node.js/Express, and PostgreSQL using Drizzle ORM. The app features role-based access control (Admin/Sales Rep), a Kanban-style pipeline view, calendar scheduling, and Excel import functionality for leads.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **Design System**: Linear-inspired modern aesthetic with Fluent Design principles for enterprise data density

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Session Management**: Express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Session-based auth with bcrypt password hashing
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Data Layer
- **Database**: PostgreSQL
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Key Entities**:
  - `users` - User accounts with roles (ADMIN/SALES)
  - `leads` - Sales leads with status tracking, assignment, and contact scheduling
  - `leadHistory` - Audit trail of lead changes
  - `notifications` - In-app notification system
- **Migrations**: Managed via Drizzle Kit (`drizzle-kit push`)

### Role-Based Access Control
- **ADMIN**: Full access to all leads, user management, Excel import
- **SALES**: Access limited to assigned leads and self-created leads

### Key Features
- **Kanban Board**: Drag-and-drop lead status management using @hello-pangea/dnd
- **Calendar View**: Lead scheduling with react-big-calendar, time picker for drag-and-drop rescheduling
- **Excel Import**: XLSX file processing with duplicate detection and conflict resolution UI
- **Notifications**: Bell icon notifications when leads are assigned
- **Settings Page**: Password change and notification preferences (accessible to all users)

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds static assets to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **TypeScript**: Strict mode enabled, path aliases configured (@/, @shared/)

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, requires `DATABASE_URL` environment variable

### Core Libraries
- **Drizzle ORM + drizzle-zod**: Database queries and schema validation
- **Express + express-session**: HTTP server and session handling
- **bcryptjs**: Password hashing
- **xlsx**: Excel file parsing for lead import

### Frontend Libraries
- **@tanstack/react-query**: Server state management
- **react-big-calendar**: Calendar component with drag-and-drop
- **@hello-pangea/dnd**: Drag-and-drop for Kanban board
- **react-dropzone**: File upload handling
- **date-fns**: Date formatting and manipulation
- **Radix UI**: Accessible UI primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library

### Session Storage
- **connect-pg-simple**: PostgreSQL-backed session storage with automatic table creation
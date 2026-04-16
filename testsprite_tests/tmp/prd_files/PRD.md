# Product Requirements Document (PRD) - CRM Freelancer

## 1. Project Overview
"CRM Freelancer" is a comprehensive Customer Relationship Management web application designed specifically for independent professionals and freelancers. It allows users to manage their client base, track business opportunities (deals) through a visual Kanban pipeline, generate quotes, manage invoices, and maintain a history of interactions and reminders. 

## 2. Technical Stack
- **Frontend**: React 19, Next.js 15 (App Router), Tailwind CSS, Radix UI primitives.
- **Backend**: Next.js API Routes.
- **Database ORM**: Prisma Client.
- **Database Engine**: PostgreSQL.
- **Authentication**: NextAuth.js v5 (beta) with credentials/Prisma adapter.
- **Other tools**: Dnd-kit (drag and drop for Kanban), React Hook Form & Zod (form validation), Recharts (data visualization), TypeScript.

## 3. Core Entities (Data Model)
The system is built upon the following highly cohesive entities:
- **User**: The application user (freelancer).
- **Company**: Organizations the freelancer works with.
- **Contact**: Individual people the freelancer communicates with (can be linked to a Company).
- **Deal**: Business opportunities tracked in a pipeline. Deals can be linked to a Contact and/or a Company.
- **Quote**: Formal proposals detailing items, taxes, and totals attached to a Deal.
- **Invoice**: Billable documents attached to a Deal or generated from a Quote.
- **Interaction**: Log of communications (email, calls, meetings) tied to any contact/deal.
- **Reminder**: Actionable tasks or alerts related to a deal.

## 4. Key Features & Modules

### 4.1 Authentication & Authorization
- Secure login and registration using email/password (bcrypt hashing).
- Session management fully integrated with NextAuth.
- All dashboard routes are strictly protected and require active session.

### 4.2 Dashboard & Reporting
- **Overview**: Centralized dashboard offering a snapshot of active deals, recent activities, and key metrics.
- **Reporting**: Analytical views presenting data on deals won/lost, revenue projections, and conversion rates using Recharts.

### 4.3 Contacts & Companies Management
- CRUD functionality to save and track contacts (firstName, lastName, email, phone, position) and companies (name, email, phone, website, address).
- Association between contacts and companies.

### 4.4 Deals Pipeline (Sales Kanban)
- Visual Kanban board representing deals in different stages (`PROSPECTO`, `CONTACTADO`, `PROPUESTA_ENVIADA`, `NEGOCIACION`, `CERRADO_GANADO`, `CERRADO_PERDIDO`).
- Drag-and-drop mechanics using `@dnd-kit` to move deals seamlessly across stages in the pipeline.
- Detail views for deals describing value, expected close date, and linked contacts.

### 4.5 Quotes & Invoicing
- **Quotes**: Ability to generate quotes with line items, automatically calculate subtotals, taxes, and totals. Quotes can have statuses like `BORRADOR` (draft), `ENVIADA` (sent), `ACEPTADA` (accepted), or `RECHAZADA` (rejected).
- **Invoices**: Conversion of deals or quotes into billable invoices. Track statuses (`PENDIENTE`, `PAGADA`, `VENCIDA`, `CANCELADA`) and due dates.

### 4.6 Interactions & Reminders
- Logging various interaction types (emails, calls, meetings, notes, WhatsApp messages) for complete history.
- Contextual reminders configured with dates, linked to specific deals to ensure follow-ups occur.

## 5. Security & Best Practices
- Robust API input validation handled by Zod schemas.
- Route handlers (`src/app/api/...`) secured with NextAuth session checks to prevent unauthorized access.
- Cascading deletes handled natively at the Prisma level to prevent orphaned records.

## 6. Known Limitations / Future Enhancements
- Expand reporting capabilities for diverse operational metrics.
- Incorporate file attachments inside deals or contacts.
- Implement role-based access control (RBAC) if multiple users per account/tenant are supported.

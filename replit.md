# Hệ thống Hỗ trợ Người dùng
## HỖ TRỢ NGƯỜI DÙNG HỆ THỐNG GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH TỈNH BẮC NINH

### Overview
This application is a professional administrative feedback tracking system for Bắc Ninh Province. It enables government departments and citizens to submit, track, and manage feedback, issues, and suggestions. Key capabilities include AI-powered notification generation, secure admin authentication, a unique sequential tracking number system, and comprehensive statistics and reporting. The project aims to streamline administrative procedures, enhance transparency, and improve citizen engagement within Bắc Ninh Province.

### User Preferences
No specific user preferences were provided in the original document.

### System Architecture
The system is built as a full-stack application with a clear separation of concerns.

**UI/UX Decisions:**
- **Aesthetic**: Professional Vietnamese government aesthetic with a blue primary color scheme (#3b82f6).
- **Typography**: Clean, accessible Inter font.
- **Responsiveness**: Designed for both mobile and desktop.
- **Layout**: Professional card-based layout with subtle shadows and smooth transitions.
- **Status Cards**: Color-coded feedback status cards: Blue for "Received", Amber for "Processing", Green for "Resolved".
- **Information Display**: Structured sender, department, and assignee information with icons.

**Technical Implementations & Feature Specifications:**
- **Public Feedback Submission**: Users can submit feedback with department name, title, description, contact information (name and 10-11 digit phone number), and optional images (max 5MB). Each submission receives a unique sequential tracking number.
- **Admin Dashboard**: Secure admin access for viewing reports, updating feedback status (Received → Processing → Resolved), assigning feedback to staff (with flexible assignment, search, and custom names), and managing staff and geographic units.
- **AI Notifications**: Google Gemini generates contextual Vietnamese notification messages, including tracking numbers and assignment details.
- **Statistics & Reporting**: Real-time statistics with percentage breakdowns, assignee workload tracking, resolution rates per assignee, and CSV/text data export functionality.
- **Staff Management System**: Full CRUD (Create, Read, Update, Delete) functionality for staff members and geographic units via an admin UI with "Cán bộ", "Địa bàn", and "Phân công" tabs.
- **Auto-Assignment Logic**: Automatic staff assignment based on the `unitName` provided in new feedback. If a staff member is assigned to a unit, the feedback is automatically assigned to them, and its status changes to "processing". If no staff is found, the status remains "received".
- **Public "Mark as Resolved"**: Public users can mark feedback as resolved (when in "processing" status) using the admin password for verification.
- **Rating System**: Users can rate resolved feedback (1-5 stars) with an optional comment, after phone number verification.
- **Notifications**: Telegram Bot API for real-time notifications for new feedback, assignee assignment, and status changes. Markdown escaping is applied to prevent parsing errors.

**System Design Choices:**
- **Frontend**: React 19, TypeScript, TanStack Query, Wouter, Shadcn UI, Tailwind CSS.
- **Backend**: Express.js, TypeScript.
- **Database**: PostgreSQL with Drizzle ORM for persistent storage.
- **API Endpoints**:
    - **Feedback**: `GET /api/feedbacks`, `POST /api/feedbacks`, `PATCH /api/feedbacks/:id/status`, `PATCH /api/feedbacks/:id/assign`, `POST /api/feedbacks/:id/mark-resolved`, `POST /api/feedbacks/:id/review`, `PATCH /api/feedbacks/:id`, `DELETE /api/feedbacks/:id`.
    - **Staff Management**: `GET /api/staff`, `GET /api/staff/:id`, `POST /api/staff`, `PATCH /api/staff/:id`, `DELETE /api/staff/:id`, `GET /api/staff/:id/units`.
    - **Unit Management**: `GET /api/units`, `GET /api/units/:id`, `POST /api/units`, `PATCH /api/units/:id`, `DELETE /api/units/:id`, `GET /api/units/:id/staff`.
    - **Staff-Unit Assignment**: `POST /api/staff/:staffId/units/:unitId`, `DELETE /api/staff/:staffId/units/:unitId`.
    - **Admin**: `POST /api/admin/login`.
- **Validation**: `contactName` is required (min 1 char), `contactPhone` is required (10-11 digits, Vietnamese format).

### External Dependencies
- **Google Gemini 2.5 Flash**: Used for AI-powered contextual notification generation.
- **PostgreSQL**: Database for persistent storage, hosted on Neon.
- **Telegram Bot API**: Optional, for real-time notifications to a Telegram channel/chat.
- **Drizzle ORM**: Used for database interaction with PostgreSQL.
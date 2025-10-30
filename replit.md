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
- **Staff Authentication System**: Session-based authentication for staff members with simple access code login (e.g., "CB001"). Staff can only access feedbacks assigned to them through a secure scoped endpoint. Features include:
  - Staff login with single access code (no username/password required for ease of use)
  - Auto-generated access codes in format CB### (CB001, CB002, etc.) if not manually set
  - express-session with httpOnly, sameSite cookies
  - Session-based authorization (401 for unauthenticated, 403 for unauthorized)
  - Staff dashboard showing only assigned feedbacks with statistics
  - Status update capabilities (mark as resolved, reopen)
  - Confirmation dialogs for status changes
  - Public display of staff phone numbers in feedback cards for citizen contact
  - Staff logout redirects to home page for easy access to public view
- **AI Notifications**: Google Gemini generates contextual Vietnamese notification messages, including tracking numbers and assignment details.
- **Statistics & Reporting**: Real-time statistics with percentage breakdowns, assignee workload tracking, resolution rates per assignee, and CSV/text data export functionality.
- **Staff Management System**: Full CRUD (Create, Read, Update, Delete) functionality for staff members and geographic units via an admin UI with "Cán bộ", "Địa bàn", and "Phân công" tabs. Admin can set access codes for staff members to enable individual logins. Staff phone numbers are publicly displayed to allow citizens to contact assigned staff directly.
- **Auto-Assignment Logic**: Automatic staff assignment based on the `unitName` provided in new feedback. If a staff member is assigned to a unit, the feedback is automatically assigned to them, and its status changes to "processing". If no staff is found, the status remains "received".
- **Resolution Comments with Images**: Staff can provide detailed resolution feedback when marking issues as resolved:
  - Required text comment explaining the resolution
  - Optional image upload (max 5MB) showing evidence or proof of resolution
  - Public display of resolution comments and images in green-highlighted section
  - Real-time UI updates - changes visible immediately without page reload
  - Both comment and image cleared when feedback is reopened
  - Cache invalidation ensures staff and public views stay synchronized
  - Resolution editing capability - staff can edit resolution comments directly without reopening feedback via "Chỉnh sửa ý kiến" button
  - Staff dashboard displays resolution comments immediately after submission for review and editing
- **Search and Filter Capabilities**: Comprehensive search and time-based filtering across all interfaces:
  - **Public Interface**: Search by location (unitName) and sender name (contactName), with dynamic year/month filtering based on available feedback data
  - **Staff Dashboard**: Search by location, sender name, and title, with year/month filtering on assigned feedbacks only
  - Dynamic available years generated from actual feedback submission dates
  - Real-time result count display when filters are active
- **Enhanced UI Clarity**: Improved feedback content display for better readability:
  - Added "Nội dung kiến nghị:" section label for feedback descriptions
  - Increased font size from text-sm to text-base for both feedback descriptions and resolution comments
  - Improved text contrast (text-foreground instead of text-muted-foreground) for feedback content
  - Added whitespace-pre-wrap to preserve line breaks in descriptions and resolutions
  - Enhanced resolution section with larger icon (w-5 h-5) and stronger border (border-t-2) for visual prominence
  - Improved spacing and padding throughout feedback cards
- **Rating System**: Users can rate resolved feedback (1-5 stars) with an optional comment, after phone number verification. Public users can only review resolved feedback, not mark them as resolved (staff-only action).
- **Notifications**: Telegram Bot API for real-time notifications for new feedback, assignee assignment, and status changes. Markdown escaping is applied to prevent parsing errors.

**System Design Choices:**
- **Frontend**: React 19, TypeScript, TanStack Query, Wouter, Shadcn UI, Tailwind CSS.
- **Backend**: Express.js, TypeScript.
- **Database**: PostgreSQL with Drizzle ORM for persistent storage.
- **API Endpoints**:
    - **Feedback**: `GET /api/feedbacks`, `POST /api/feedbacks`, `PATCH /api/feedbacks/:id/status`, `PATCH /api/feedbacks/:id/assign`, `POST /api/feedbacks/:id/mark-resolved`, `POST /api/feedbacks/:id/review`, `PATCH /api/feedbacks/:id`, `DELETE /api/feedbacks/:id`.
    - **Staff Management**: `GET /api/staff`, `GET /api/staff/:id`, `POST /api/staff`, `PATCH /api/staff/:id`, `DELETE /api/staff/:id`, `GET /api/staff/:id/units`, `GET /api/staff/:id/feedbacks` (session-protected).
    - **Unit Management**: `GET /api/units`, `GET /api/units/:id`, `POST /api/units`, `PATCH /api/units/:id`, `DELETE /api/units/:id`, `GET /api/units/:id/staff`.
    - **Staff-Unit Assignment**: `POST /api/staff/:staffId/units/:unitId`, `DELETE /api/staff/:staffId/units/:unitId`.
    - **Authentication**: `POST /api/admin/login`, `POST /api/staff/login`.
- **Validation**: `contactName` is required (min 1 char), `contactPhone` is required (10-11 digits, Vietnamese format).

### External Dependencies
- **Google Gemini 2.5 Flash**: Used for AI-powered contextual notification generation.
- **PostgreSQL**: Database for persistent storage, hosted on Neon.
- **Telegram Bot API**: Optional, for real-time notifications to a Telegram channel/chat.
- **Drizzle ORM**: Used for database interaction with PostgreSQL.
- **express-session**: Session management for staff authentication.

### Security Considerations
- **Staff Authentication**: Session-based authentication with httpOnly, sameSite cookies. Staff can only access their own feedbacks via scoped endpoint with authorization checks (401/403 status codes). Access codes are simple (CB###) for ease of use.
- **Access Code Security**: Access codes are stored in plain text (staff.access_code column, unique constraint) as they are designed for convenience rather than high security. For production use with sensitive data, consider implementing additional security measures.
- **Known MVP Limitations**: In-memory session store (single-instance only), name-based feedback assignment (requires schema migration to fully enforce uniqueness), access codes are simple and not cryptographically secure.
- **Secrets**: SESSION_SECRET, ADMIN_PASSWORD, GEMINI_API_KEY, TELEGRAM_BOT_TOKEN stored in environment variables.
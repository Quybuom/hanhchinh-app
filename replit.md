# Hệ thống Quản lý Phản ánh
## Vietnamese Feedback Management System

A professional administrative feedback tracking system for Trung tâm Phục vụ hành chính công tỉnh Bắc Ninh.

## Overview
This application enables government departments to submit, track, and manage feedback, issues, and suggestions. It features AI-powered notification generation using Google Gemini and secure admin authentication.

## Key Features
- **Public Feedback Submission**: Anyone can submit feedback with department name, title, description, and optional images
- **Admin Dashboard**: Secure admin access to view reports, update status, and assign feedback to staff
- **AI Notifications**: Gemini AI generates contextual Vietnamese notification messages
- **Status Tracking**: Three-stage workflow (Received → Processing → Resolved)
- **Staff Assignment**: Assign feedback to specific team members
- **Statistics & Reporting**: Real-time statistics and comprehensive reporting

## Technical Stack
- **Frontend**: React 19, TypeScript, TanStack Query, Wouter, Shadcn UI
- **Backend**: Express.js, TypeScript, PostgreSQL database (Neon)
- **Database**: Drizzle ORM with PostgreSQL for persistent storage
- **AI**: Google Gemini 2.5 Flash for notification generation
- **Notifications**: Telegram Bot API for real-time notifications (optional)
- **Styling**: Tailwind CSS with custom design system

## Environment Variables
Required secrets (configured in Replit Secrets):
- `GEMINI_API_KEY`: Google Gemini API key for AI notifications
- `ADMIN_PASSWORD`: Secure password for admin authentication
- `TELEGRAM_BOT_TOKEN`: Telegram Bot API token (optional - for real-time Telegram notifications)
- `TELEGRAM_CHAT_ID`: Telegram Chat ID to receive notifications (optional - required if TELEGRAM_BOT_TOKEN is set)

### Setting up Telegram Notifications (Optional)
1. Create a Telegram bot by talking to @BotFather on Telegram
2. Copy the bot token to TELEGRAM_BOT_TOKEN secret
3. Start a chat with your bot and send a message
4. Get your chat ID by visiting: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. Copy the chat ID to TELEGRAM_CHAT_ID secret
6. Restart the application to enable Telegram notifications

## Running the Application
The application runs automatically via the "Start application" workflow which executes `npm run dev`. The server runs on port 5000.

## User Guide

### Submitting Feedback
1. Click "Gửi phản ánh" button in the header
2. Fill in the form:
   - Tên đơn vị (Department name)
   - Tiêu đề (Title)
   - Mô tả chi tiết (Detailed description)
   - Link hình ảnh (Image URL - optional)
3. Click "Gửi phản ánh" to submit
4. Receive AI-generated confirmation message

### Admin Features
1. Click the login icon in the header
2. Enter the admin password (configured in ADMIN_PASSWORD secret)
3. Once authenticated, you can:
   - View comprehensive reports
   - Update feedback status (Received → Processing → Resolved)
   - Assign feedback to team members
   - View detailed statistics

### Available Staff Members
- Nguyễn Văn An
- Trần Thị Bình
- Lê Hoàng Cường
- Phạm Thị Dung
- Võ Minh Long

## Architecture

### Data Model
```typescript
interface Feedback {
  id: string;
  unitName: string;
  title: string;
  description: string;
  imageUrl: string | null;
  submittedAt: Date;
  status: "received" | "processing" | "resolved";
  assignee: string | null;
}
```

### API Endpoints
- `GET /api/feedbacks` - List all feedback
- `POST /api/feedbacks` - Create new feedback
- `PATCH /api/feedbacks/:id/status` - Update status
- `PATCH /api/feedbacks/:id/assign` - Assign to staff
- `POST /api/admin/login` - Admin authentication

## Design
The application follows a professional Vietnamese government aesthetic with:
- Blue primary color scheme (#3b82f6)
- Clean, accessible typography using Inter font
- Responsive design for mobile and desktop
- Professional card-based layout
- Subtle shadows and smooth transitions

## Recent Changes
- October 28, 2025: Production deployment with enhanced features
  - Complete feedback management system with persistent PostgreSQL database
  - AI-powered notification messages with Gemini
  - Real-time Telegram Bot notifications (optional feature)
  - Secure server-side authentication
  - Vietnamese language UI throughout
  - Professional government aesthetic design

## Next Steps
To deploy this application live on Replit:
1. Ensure both secrets are configured (GEMINI_API_KEY and ADMIN_PASSWORD)
2. Click the "Publish" button to make it accessible via a public URL
3. Share the URL with department staff

## Support
For questions or issues, contact the Replit support team or review the code documentation.

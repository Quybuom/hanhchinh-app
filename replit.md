# Hệ thống Hỗ trợ Người dùng
## HỖ TRỢ NGƯỜI DÙNG HỆ THỐNG GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH TỈNH BẮC NINH

A professional administrative feedback tracking system for Bắc Ninh Province.

## Overview
This application enables government departments to submit, track, and manage feedback, issues, and suggestions. It features AI-powered notification generation using Google Gemini and secure admin authentication.

## Key Features
- **Public Feedback Submission**: Anyone can submit feedback with department name, title, description, contact information (name and phone), and optional images
- **Contact Information Collection**: Required contact name and phone number (10-11 digits) for all new feedback submissions
- **Admin Dashboard**: Secure admin access to view reports, update status, and assign feedback to staff
- **AI Notifications**: Gemini AI generates contextual Vietnamese notification messages
- **Status Tracking**: Three-stage workflow (Received → Processing → Resolved)
- **Flexible Staff Assignment**: 
  - Assign feedback to anyone (not limited to predefined list)
  - Search and filter from existing assignees
  - Type custom assignee names
  - Assignee information visible to all users
- **Enhanced Statistics & Reporting**: 
  - Real-time statistics with percentage breakdowns
  - Assignee workload tracking
  - Resolution rates per assignee
  - Comprehensive data exports

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
   - **Thông tin liên hệ** (Contact Information):
     - Họ và tên (Full name - required)
     - Số điện thoại (Phone number - required, 10-11 digits)
   - Tiêu đề (Title)
   - Mô tả chi tiết (Detailed description)
   - Hình ảnh (Image upload - optional, max 5MB)
3. Click "Gửi phản ánh" to submit
4. Receive AI-generated confirmation message

### Admin Features
1. Click the login icon in the header
2. Enter the admin password (configured in ADMIN_PASSWORD secret)
3. Once authenticated, you can:
   - **View comprehensive reports** with percentages for each status
   - **Update feedback status** (Received → Processing → Resolved)
   - **Assign feedback** to team members or type new names
   - **View detailed statistics** including:
     - Status breakdown with percentages
     - Assignee workload (number of feedback items per person)
     - Resolution rates per assignee
   - **Export data** in CSV format or text reports

### Staff Assignment
Admin can assign feedback to any staff member:
- **Suggested Assignees** (quick selection):
  - Nguyễn Văn An
  - Trần Thị Bình
  - Lê Hoàng Cường
  - Phạm Thị Dung
  - Võ Minh Long
- **Custom Names**: Type any new name to add assignee on the fly
- **Searchable**: Filter through existing assignees
- **Visible to All**: Everyone can see who is assigned to each feedback

## Architecture

### Data Model
```typescript
interface Feedback {
  id: string;
  unitName: string;
  title: string;
  description: string;
  imageUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  submittedAt: Date;
  status: "received" | "processing" | "resolved";
  assignee: string | null;
}
```

**Validation Rules for New Submissions:**
- `contactName`: Required, minimum 1 character
- `contactPhone`: Required, must be 10-11 digits (Vietnamese phone format)

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
- October 28, 2025: System renamed and contact information feature added
  - **System Name Updated**: "HỖ TRỢ NGƯỜI DÙNG HỆ THỐNG GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH TỈNH BẮC NINH"
  - **Contact Information**: Required contact name and phone number for all new feedback submissions
  - Enhanced form with dedicated "Thông tin liên hệ" section
  - Phone validation: 10-11 digits Vietnamese format
  - Database schema updated with nullable contact fields for backward compatibility
  - Complete feedback management system with persistent PostgreSQL database
  - AI-powered notification messages with Gemini
  - Real-time Telegram Bot notifications (optional feature)
  - Secure server-side authentication
  - Vietnamese language UI throughout
  - Professional government aesthetic design

## Features Implemented

### Core Features (Completed)
- ✅ Public feedback submission with department name, title, and description
- ✅ AI-powered Vietnamese notification messages using Gemini
- ✅ Secure server-side admin authentication
- ✅ Three-stage status workflow (Received → Processing → Resolved)
- ✅ Staff assignment functionality
- ✅ Real-time statistics and reporting dashboard

### Enhanced Features (Completed)
- ✅ **PostgreSQL Database**: Persistent storage with Drizzle ORM - data survives restarts
- ✅ **Telegram Bot Notifications**: Optional real-time notifications to Telegram (when configured)
- ✅ **File Upload**: Secure image upload with 5MB limit and preview functionality
- ✅ **Export Functionality**: CSV and text report exports for data analysis and archiving

## Next Steps
To deploy this application live on Replit:
1. Ensure all required secrets are configured:
   - **Required**: GEMINI_API_KEY, ADMIN_PASSWORD
   - **Optional** (for Telegram): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
2. Click the "Publish" button to make it accessible via a public URL
3. Share the URL with department staff

The application is production-ready with:
- Secure file handling with path traversal protection
- Proper CSV escaping for Vietnamese text in Excel
- Graceful degradation when optional services (Telegram) are not configured
- Comprehensive error handling throughout

## Support
For questions or issues, contact the Replit support team or review the code documentation.

# Design Guidelines: Vietnamese Government Feedback Management System

## Design Approach

**Selected Approach:** Design System-Based (Material Design influence)
**Justification:** This is a data-heavy, utility-focused administrative dashboard requiring clarity, efficiency, and professional government aesthetic. The interface prioritizes information hierarchy and workflow efficiency over visual flair.

**Core Principles:**
- Clarity and scanability for processing multiple feedback items
- Professional government aesthetic with subtle modern touches
- Clear status indicators and action pathways
- Efficient data density without overwhelming users

---

## Typography System

**Font Stack:**
- Primary: 'Inter' via Google Fonts (clean, readable for Vietnamese characters)
- Fallback: system-ui, -apple-system, sans-serif

**Hierarchy:**
- Page Headers: 2.25rem (36px), font-weight 700, letter-spacing tight
- Section Titles: 1.5rem (24px), font-weight 600
- Card Titles/Feedback Titles: 1.125rem (18px), font-weight 600
- Body Text: 0.875rem (14px), font-weight 400, line-height 1.5
- Metadata/Timestamps: 0.75rem (12px), font-weight 500
- Button Text: 0.875rem (14px), font-weight 500, letter-spacing 0.02em

---

## Layout System

**Spacing Primitives:** Consistent use of Tailwind units: 2, 4, 6, 8, 12, 16, 24
- Micro spacing (between elements): 2-4 units
- Component internal padding: 6-8 units
- Section spacing: 12-16 units
- Page margins: 24 units

**Container Strategy:**
- Max-width: 7xl (1280px) for main content area
- Responsive padding: px-4 (mobile), sm:px-6, lg:px-8
- Content cards: Full width within container, stacked vertically

**Grid Systems:**
- Summary Cards: 3-column grid on desktop (grid-cols-1 md:grid-cols-3), single column mobile
- Feedback List: Single column with full-width cards
- Admin Report Modal: 2-column layout for statistics

---

## Component Library

### Header Navigation
- Fixed top position with shadow elevation
- Logo/title on left, action buttons on right
- Two primary CTAs: "Thêm phản ánh mới" (primary button), "Xem báo cáo" (secondary button)
- Admin login/logout indicator in top-right corner
- Height: 16 units (64px), maintains space below when scrolling

### Summary Dashboard
- Three metric cards displaying: Total Feedback, Processing, Resolved counts
- Each card includes: Large number (3rem), label below, subtle icon top-right
- Cards have subtle elevation (shadow-md), rounded corners (rounded-lg)
- Spacing between cards: 6 units
- Each card includes trend indicator if applicable

### Feedback Card List
- Full-width cards with structured information layout
- Card structure (top to bottom):
  - Header row: Unit name badge (left) + timestamp (right)
  - Feedback title (bold, 18px)
  - Description text (14px, line-clamp-3 for long content)
  - Optional image thumbnail (if present, max-height 200px, rounded corners)
  - Footer row: Status badge + Assignee info + Action dropdown
- Card spacing: 4 units between cards
- Elevation: shadow-sm default, shadow-md on hover
- Rounded corners: rounded-lg

### Status Badges
- Pill-shaped with rounded-full
- Padding: px-3 py-1
- Three states clearly differentiated through background treatment:
  - "Mới tiếp nhận" (Received) - lightest treatment
  - "Đang xử lý" (Processing) - medium treatment  
  - "Đã xử lý" (Resolved) - strongest treatment
- Text: 0.75rem, font-weight 600, uppercase tracking

### Modal Dialogs (Add Feedback, Admin Auth, Report)
- Centered overlay with backdrop blur
- Modal width: max-w-2xl for form modals, max-w-4xl for report modal
- Padding: p-8
- Rounded corners: rounded-xl
- Close button: top-right corner with X icon
- Form fields with consistent vertical spacing (6 units between fields)

### Form Elements
- Input fields: Full width, rounded-md, border treatment, padding py-3 px-4
- Labels: Above inputs, font-weight 600, mb-2
- Textareas: min-height 32 units (128px)
- File upload: Dashed border, centered icon and text, padding py-8
- Select dropdowns: Consistent styling with text inputs

### Buttons
**Primary Actions:**
- Padding: px-6 py-3
- Rounded: rounded-md
- Font: 0.875rem, font-weight 600
- Shadow: shadow-sm
- Includes icon + text where applicable

**Secondary Actions:**
- Same size as primary
- Border treatment instead of solid background
- Less visual weight

**Icon-only Buttons:**
- Square aspect ratio, padding-4
- Used for close, edit, delete actions

### Admin Controls
- Inline status update dropdown within each card
- Assignee selection dropdown with search capability
- Action menu (three-dot icon) for additional options

### Toast Notifications
- Fixed bottom-right position
- Width: max-w-md
- Padding: p-4
- Rounded: rounded-lg
- Auto-dismiss after 5 seconds
- Slide-in animation from right

### Footer
- Simple centered text
- Padding: py-6
- Text size: 0.875rem
- Includes organization name: "Trung tâm Phục vụ hành chính công tỉnh Bắc Ninh"

---

## Visual Hierarchy

**Information Priority:**
1. Feedback status and title (most prominent)
2. Unit name and assignee (secondary)
3. Description content (tertiary)
4. Metadata (timestamps, IDs)

**Elevation Layers:**
- Base layer: Page background
- Level 1: Summary cards (shadow-md)
- Level 2: Feedback cards (shadow-sm, shadow-md on hover)
- Level 3: Modals and dropdowns (shadow-xl)
- Level 4: Toast notifications (shadow-2xl)

---

## Interactive States

**Cards:**
- Default: shadow-sm
- Hover: shadow-md with smooth transition
- Active: subtle scale transform (scale-[0.99])

**Buttons:**
- Hover: Opacity 90%, subtle lift (translateY -1px)
- Active: Opacity 80%, no lift
- Disabled: Opacity 50%, cursor not-allowed

**Form Inputs:**
- Focus: Enhanced border treatment, subtle shadow ring
- Error: Border and text treatment indicating validation issue
- Disabled: Reduced opacity, different background treatment

---

## Responsive Behavior

**Breakpoints:**
- Mobile (base): Single column layout, simplified header
- Tablet (md: 768px): 2-column summary grid, full feature set
- Desktop (lg: 1024px): 3-column summary grid, optimized spacing

**Mobile Optimizations:**
- Stacked navigation buttons become dropdown menu
- Summary cards stack vertically
- Feedback cards maintain full information but with adjusted spacing
- Modal dialogs occupy 95% viewport width
- Form fields maintain full width for easy tapping

---

## Accessibility

**Focus Management:**
- Visible focus indicators on all interactive elements
- Modal focus trapping when open
- Keyboard navigation for dropdowns and forms

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels for icon-only buttons
- Status badges include hidden text describing state
- Form validation messages announced to screen readers

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- Adequate spacing between adjacent clickable items

---

## Images

**Image Usage:**
- Optional feedback attachments displayed as thumbnails within cards
- Placeholder for screenshots/evidence: 400x300px aspect ratio
- Image preview on click opens lightbox modal
- Rounded corners (rounded-md) for all images
- Max-width constraints prevent layout breaking

**No Hero Images:** This is a functional dashboard, not a marketing page. Focus remains on data and actions.

---

## Performance Considerations

- Lazy load feedback images
- Virtualized list if feedback items exceed 50
- Debounced search/filter inputs
- Optimistic UI updates for status changes
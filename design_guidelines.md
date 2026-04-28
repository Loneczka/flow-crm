# CRM Desktop Application Design Guidelines

## Design Approach

**Selected Approach:** Design System + CRM Industry Best Practices

Drawing inspiration from **Linear's** modern productivity aesthetic combined with **Salesforce/HubSpot** CRM conventions. Using **Fluent Design** principles for enterprise data-heavy interfaces with **Material Design** interaction patterns for drag-and-drop and calendar components.

**Core Principles:**
- Information density without clutter
- Rapid data scanning and processing
- Professional corporate aesthetic
- Desktop-optimized interactions
- Clear visual hierarchy for role-based features

## Typography

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - Clean, professional, excellent at small sizes
- Monospace: 'JetBrains Mono' - For timestamps, IDs, technical data

**Type Scale:**
- Headings (Page Titles): text-2xl font-semibold (24px)
- Section Headers: text-lg font-semibold (18px)
- Card Titles: text-base font-medium (16px)
- Body Text: text-sm (14px)
- Secondary/Meta: text-xs (12px)
- Small Labels: text-xs font-medium uppercase tracking-wide

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16 (p-2, m-4, gap-6, etc.)

**Container Structure:**
- App Shell: Fixed sidebar (w-64) + Main content area with top navigation bar (h-16)
- Content Padding: px-8 py-6 for main content areas
- Card/Component Spacing: p-6 for large cards, p-4 for compact components
- Grid Gaps: gap-4 for tight layouts, gap-6 for comfortable spacing

**Responsive Breakpoints:**
- Primary: min-w-[1280px] - Standard desktop
- Minimum: min-w-[1024px] - Compact desktop
- No mobile optimization needed

## Core Component Library

### Navigation & Shell

**Sidebar Navigation:**
- Fixed left sidebar (w-64, h-screen)
- Logo/branding at top (h-16 matching header)
- Navigation items: px-4 py-2.5, rounded-lg hover states
- Active state: Subtle left border (border-l-4) with background tint
- Role indicator badge at bottom of sidebar
- Notification bell icon (relative with absolute badge for count)

**Top Header Bar:**
- Fixed height h-16 with shadow-sm
- User profile dropdown in top-right
- Search bar in center (when applicable)
- Breadcrumb navigation on left

### Dashboard Components

**Sales Rep Dashboard:**
- "Today's Agenda" section: Full-width card at top
- Agenda items: List with timeline markers, lead name, time (using monospace), status pill
- Stats Grid: 4-column grid (grid-cols-4) below agenda
- Stat cards: Minimal design with large number (text-3xl font-bold), small label below

**Admin Dashboard:**
- Filter bar: Horizontal layout with Sales Rep selector dropdown (w-64)
- Stats Overview: 3-column grid for aggregate metrics
- Charts/Graphs: Use recharts library with minimal styling, grid lines, subtle axes
- Lead Distribution Table: Striped rows (even:bg-gray-50), sortable columns

### Kanban Board

**Board Layout:**
- Horizontal scrollable container (overflow-x-auto)
- 6 columns for statuses (New, In Progress, Hold, Proposal, Won, Lost)
- Column width: min-w-[320px] max-w-[360px]
- Column header: Sticky top, status name + count badge
- Drag handle visual: Subtle grip icon (6 dots) on hover

**Lead Cards:**
- Compact design: p-4, rounded-lg, shadow-sm
- Header: Lead name (font-medium) + assigned user avatar
- Meta row: Phone icon + truncated number, Email icon + truncated email
- Status indicator: Colored dot (h-2 w-2 rounded-full)
- Last contact date: Small text with calendar icon
- Hover state: shadow-md, slight scale transform

### Calendar View

**Calendar Layout:**
- Use react-big-calendar default styling as base
- Week/Month view toggle buttons (top-right)
- Lead events: Small colored blocks with lead name
- Drag state: Opacity reduction + dashed border
- Time slots: Vertical lines every hour, horizontal day divisions

**Time Picker Modal (when dropping lead):**
- Centered modal (max-w-md)
- Large time input with increment/decrement buttons
- Date display at top (read-only, showing dropped date)
- Confirm/Cancel buttons at bottom

### Lead Detail Modal

**Modal Structure:**
- Large centered modal (max-w-3xl)
- Header: Lead name (text-xl font-semibold), close X button (top-right)
- Two-column layout (grid-cols-2 gap-8)
- Left column: Lead information fields (stacked vertically, gap-4)
- Right column: History Timeline

**History Timeline:**
- Vertical line on left (border-l-2)
- Timeline items: Relative positioning with circle markers
- Each item: User name, action description, timestamp
- Alternating background for items (nth-child pattern)

### Forms & Inputs

**Input Fields:**
- Standard height: h-10
- Padding: px-3
- Border: border rounded-md
- Focus state: ring-2 ring-offset-1
- Labels: text-sm font-medium mb-2 block

**Status Dropdown:**
- Custom select with status pill previews
- Grouped by category (Active, Closed Won, Closed Lost)

**Excel Import (Admin):**
- Upload dropzone: Dashed border (border-2 border-dashed), centered upload icon
- Drag-over state: Background tint
- Conflict table: Striped rows, checkbox column, action buttons (Skip/Overwrite) per row
- Bulk actions toolbar above table

### Notification System

**Bell Icon:**
- Fixed in top navigation
- Badge overlay: Absolute positioned, rounded-full, text-xs
- Dropdown panel: max-w-sm, max-h-96 overflow-y-auto
- Notification items: p-3, border-b, unread items with subtle background
- Message text + timestamp (text-xs, text-gray-500)

## Interaction Patterns

**Drag & Drop:**
- Drag handle appears on hover (cursor-grab)
- During drag: cursor-grabbing, reduced opacity (opacity-60)
- Drop zones: Dashed border indication when dragging over
- Success feedback: Brief green flash or checkmark animation

**Loading States:**
- Skeleton screens for data-heavy views (cards, tables)
- Spinner for actions (button disabled state with spinner icon)
- Progress bar for Excel import processing

**Empty States:**
- Centered illustrations (simple line icons, large size)
- Helpful message: "No leads yet" or "No upcoming contacts"
- Primary action button below message

## Data Display

**Tables:**
- Dense rows: py-2 px-4
- Header: Sticky, font-medium, border-b-2
- Sortable columns: Arrow icon on hover
- Row hover: Subtle background change
- Zebra striping for long tables

**Status Pills:**
- Rounded-full, px-3 py-1, text-xs font-medium
- Different background opacity levels per status
- Inline-flex alignment with icons when needed

**Avatars:**
- Circular, multiple sizes (h-6 w-6 for inline, h-10 w-10 for profiles)
- Initials fallback (centered, font-medium)
- Online indicator: Green dot bottom-right

## Images

This is a data-centric business application with no hero sections or marketing imagery. All visual elements are functional UI components (icons, avatars, status indicators). Use Lucide Icons CDN for all iconography.
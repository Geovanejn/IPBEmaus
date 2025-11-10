# Design Guidelines - Sistema Integrado IPB Emaús

## Design Approach & Philosophy

**Selected Approach:** Design System - Clean Administrative Dashboard
- Primary inspiration: Linear's clarity + Notion's organization + Material Design's structure
- Rationale: Church administrative system requiring professional trust, data density, and long-term stability
- Core principle: "Clarity through hierarchy" - complex information made accessible

## Typography System

**Font Stack:**
- Primary: Inter (Google Fonts) - exceptional readability for data-dense interfaces
- Monospace: JetBrains Mono - for financial values, dates, codes

**Hierarchy:**
- Page Titles: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Labels/Metadata: text-sm text-gray-600 (14px)
- Small Print/Timestamps: text-xs (12px)

## Layout & Spacing System

**Spacing Primitives:** Use Tailwind units of **2, 4, 8, 12, 16**
- Component padding: p-4 to p-8
- Section spacing: space-y-8 to space-y-12
- Card gaps: gap-4
- Form field spacing: space-y-4

**Container Strategy:**
- Sidebar: fixed w-64 (256px)
- Main content: max-w-7xl mx-auto px-8
- Form containers: max-w-2xl
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Navigation & Information Architecture

**Sidebar Navigation (Fixed Left):**
- Church logo/name at top (h-16)
- Module sections with icons (Heroicons):
  - 🕊️ Pastoral (Users icon)
  - 💰 Financeiro (CurrencyDollar icon)
  - 🤝 Diaconal (Heart icon)
  - 📰 Boletim (Newspaper icon)
  - 📝 Atas (DocumentText icon)
- User profile/role indicator at bottom
- Logout button below profile

**Permission-Based Visual Indicators:**
- Full access: solid icon + text
- Read-only: outlined icon + text with lock badge
- No access: hidden entirely

## Dashboard Components

**Main Dashboard (Role-Based):**
- Welcome header with user name and role
- Quick stats cards (3-column grid): total members, monthly income, pending actions
- Recent activity feed (timeline style)
- Quick action buttons for common tasks per role

**Stats Cards Structure:**
- Icon (left, large, circular background)
- Metric value (large, bold, monospace font)
- Label (below value)
- Trend indicator (small, right-aligned)

## Module-Specific Components

### Módulo Pastoral
**Member Directory:**
- Search bar (top, full-width with filter icon)
- Table view: photo thumbnail, name, status badge, family link, contact, actions
- Detail modal: photo, full information, family tree visualization, pastoral notes accordion

**Cadastro Forms:**
- Multi-step wizard for new members (3 steps: Personal, Contact, Church Info)
- Progress indicator at top
- Photo upload with preview (circular, 120px)
- Family relationship tree builder (visual nodes)

### Módulo Financeiro
**Transaction Management:**
- Dual-panel layout: filters left (w-80), transactions right
- Transaction cards with: date, category badge, description, value (monospace, right-aligned)
- Monthly summary bar chart (top of page)
- Export to CSV button (top-right)

**Receipt Generation:**
- Preview panel (right side, A4 proportion)
- Form inputs (left side)
- Live preview updates
- Download PDF button (prominent)

### Módulo Diaconal
**Visitante Tracking:**
- Kanban board view: "Novo" → "Em Acompanhamento" → "Membro" → "Inativo"
- Cards show: photo, name, invited by, date, action badges
- Timeline view option (alternative layout)

**Ações Sociais:**
- Form with action type selector (icon grid: basket, prayer, visit, financial)
- Conditional fields based on selection
- Auto-link to Financeiro when monetary value entered

### Módulo Boletim Dominical
**Editor Layout:**
- Two-column: editor left (60%), preview right (40%)
- Rich text editor with formatting toolbar
- Auto-populated sections: aniversariantes (from Pastoral), visitantes (from Diaconal)
- Event builder with date/time pickers

**Preview Panel:**
- A4 proportions
- Print-friendly layout preview
- QR code generator (bottom)
- Download PDF button

### Módulo Secretaria de Atas
**Meeting Registry:**
- Calendar view with meeting markers
- Table view: date, meeting type, participants, status badge (Draft/Approved)
- Detail view: markdown editor for minutes
- Approval workflow: review → approve → lock → PDF export

## Forms & Data Entry

**Form Structure:**
- Label above field (font-medium, text-sm)
- Input fields: h-10, rounded-lg, border-gray-300
- Required field indicator: red asterisk
- Help text: text-xs, text-gray-500 (below field)
- Error messages: text-xs, text-red-600 (below field, icon prefix)

**Form Actions:**
- Primary action: right-aligned, prominent
- Secondary/Cancel: left-aligned, subtle
- Spacing between: justify-between

## Tables & Data Display

**Table Structure:**
- Sticky header with sort indicators
- Zebra striping (subtle, gray-50 alternate rows)
- Row hover: bg-gray-100 transition
- Action column: right-aligned, icon buttons
- Pagination: bottom-center

**Empty States:**
- Centered vertically
- Large icon (96px, gray-300)
- Heading + description
- Primary action button below

## PDF Components

**Receipt/Boletim/Ata Templates:**
- Church header: logo + name + address (centered)
- Document title (centered, text-2xl)
- Content area with consistent margins
- Footer: date, signature lines, QR code (for digital verification)

## Responsive Behavior

**Breakpoints:**
- Mobile (< 768px): Single column, hamburger sidebar
- Tablet (768-1024px): Sidebar collapses to icons only
- Desktop (> 1024px): Full sidebar visible

**Mobile Adaptations:**
- Stack dashboard cards vertically
- Tables switch to card view
- Forms remain single column with larger touch targets

## Icons & Visual Elements

**Icon Library:** Heroicons (outline for navigation, solid for actions)
- Consistent 20px size for inline icons
- 24px for standalone buttons
- Badge icons: 16px

**Badges & Status Indicators:**
- Rounded-full, px-3, py-1, text-xs
- Status colors: green (active), yellow (pending), red (inactive), blue (approved)

**Loading States:**
- Skeleton loaders matching content structure
- Spinner for actions: 20px, centered

This design creates a professional, trustworthy administrative interface that balances information density with clarity, ensuring church staff can efficiently manage all aspects of the congregation while maintaining the reverence and care appropriate for a church context.
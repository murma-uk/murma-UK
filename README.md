# Murma

Community demand-signaling platform. People request new services, opening hours, branches, or
venues in their town and upvote what matters. Businesses and councils use the signals to make
better decisions.

Live at [murma.uk](https://murma.uk).

## Stack

- Frontend hosted on Vercel
- Database, auth, and storage on Supabase
- Address search via Google Maps Platform

## Open Source Components

Murma is built on the following open source libraries:

### Core Framework & UI
- **React** - JavaScript library for UI components
- **React Router DOM** - Client-side routing
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### UI Component Libraries
- **Radix UI** - Collection of unstyled, accessible components (Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Collapsible, Context Menu, Dialog, Dropdown Menu, Hover Card, Label, Menubar, Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Slot, Switch, Tabs, Toast, Toggle, Toggle Group, Tooltip)
- **Lucide React** - Icon library
- **Embla Carousel** - Carousel/slider component

### Forms & Validation
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation resolvers for Hook Form

### Data & State Management
- **TanStack React Query** - Data fetching and caching
- **Supabase JS** - Backend database, auth, and storage

### Maps & Location
- **MapLibre GL** - Open-source maps library
- **React Map GL** - React wrapper for MapLibre GL
- **@types/maplibre-gl** - TypeScript types for MapLibre GL

### UI & Animation
- **Framer Motion** - Animation library
- **React Markdown** - Markdown rendering
- **Sonner** - Toast notifications
- **Vaul** - Drawer component
- **React Resizable Panels** - Resizable panel layout
- **Recharts** - Chart library
- **React Day Picker** - Date picker
- **tailwindcss-animate** - Tailwind CSS animation utilities

### Utilities
- **Date-fns** - Date manipulation
- **Class Variance Authority** - CSS utility helper
- **clsx** - Conditional class names
- **Tailwind Merge** - Merge Tailwind CSS classes
- **Input OTP** - OTP input component
- **next-themes** - Theme management
- **React Helmet Async** - Document head management
- **cmdk** - Command palette
- **@fontsource/space-grotesk** - Space Grotesk font

### Development Tools
- **Vite** - Build tool and dev server
- **Vitest** - Unit testing framework
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefix handler
- **PostCSS** - CSS transformation
- **JSDOM** - DOM implementation for testing
- **Testing Library** - Component testing utilities

## Development

```sh
npm install
npm run dev
```

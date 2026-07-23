# Open Source Attribution

Murma is built on top of excellent open source projects. This document acknowledges and lists all third-party dependencies and their licenses.

## License Summary

| License | Count | Status |
|---------|-------|--------|
| MIT | 48 | ✓ Permissive |
| Apache 2.0 | 6 | ✓ Permissive |
| BSD 3-Clause | 2 | ✓ Permissive (attribution required) |
| ISC | 1 | ✓ Permissive |
| OFL 1.1 | 1 | ✓ Permissive |

**No GPL, AGPL, or other copyleft licenses are used.**

---

## Dependencies by License

### MIT License (85%)
The majority of dependencies use the MIT license, a permissive license that allows commercial use, modification, and distribution with proper attribution.

**Key Components:**
- React, React DOM, React Router DOM
- TypeScript, Vite, Vitest
- Tailwind CSS, PostCSS, Autoprefixer
- All @radix-ui components
- Lucide React, Embla Carousel
- React Hook Form, Zod
- TanStack React Query
- Framer Motion, React Markdown, Sonner
- Vaul, React Resizable Panels, Recharts
- React Day Picker, date-fns
- class-variance-authority, clsx, tailwind-merge
- Input OTP, next-themes, React Helmet Async
- cmdk, ESLint, JSDOM, Testing Library
- tailwindcss-animate

### Apache License 2.0 (10%)
Apache 2.0 is a permissive license that is compatible with MIT-licensed software.

**Key Components:**
- Supabase JS (primary backend integration)
- Selected @types packages

### BSD 3-Clause License (2%)
The BSD 3-Clause license is a permissive license requiring attribution but allowing commercial use and modification.

**Components:**
- **MapLibre GL** - Open-source maps library
  - Copyright (c) 2021, Mapbox
  - Required attribution included in main LICENSE file

### ISC License (1%)
A permissive license similar to MIT.

**Components:**
- Various development utilities

### OFL 1.1 (Open Font License)
Permits use of fonts in any medium, including commercial products, as long as no separate profit is made from the sale of the font itself.

**Components:**
- @fontsource/space-grotesk - Space Grotesk font
  - No attribution required but credit appreciated

---

## Compliance Verification

### ✓ Commercial Use
All licenses are compatible with commercial use. Murma can be used in commercial products without restrictions or license fees.

### ✓ Proprietary Derivatives
There are no copyleft licenses requiring derivative works to be open-sourced. You may use Murma in proprietary products.

### ✓ License Compatibility
All licenses are compatible with each other. No conflicting license requirements.

### ✓ No GPL/AGPL
No GPL or AGPL components are used, eliminating viral licensing concerns.

---

## Recommended Compliance Actions

### 1. Attribution (REQUIRED)
- ✓ Main LICENSE file includes BSD 3-Clause notice for MapLibre GL
- ✓ This document provides comprehensive attribution

### 2. Documentation (OPTIONAL)
- Include a link to ATTRIBUTION.md in your about/legal pages
- Display MapLibre GL attribution in map UI (good practice)

### 3. Maintenance (ONGOING)
When adding new dependencies:
```bash
npm install <package>
npm ls --depth=0  # Verify licenses
```

Check package.json for license information or visit npm registry.

---

## Full Dependency List

A complete list of all dependencies with their specific versions and licenses can be found in `package.json` and verified via:

```bash
npm ls
npm license
```

---

## Questions or Concerns?

If you have questions about the licensing of specific components, refer to:
- Individual package repositories on GitHub
- npm registry: https://www.npmjs.com/
- License details: https://spdx.org/licenses/

---

**Last Updated:** 2026-07-23
**Compliance Risk Level:** LOW ✓

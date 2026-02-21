# Vikasana Foundation — Admin Portal

A production-ready **React + Vite + Tailwind CSS** admin panel for the Vikasana Foundation Social Activity Tracker.

---

## 🗂️ Project Structure

```
vikasana-admin/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx              ← React DOM entry point
    ├── App.jsx               ← Router setup + protected/public routes
    ├── index.css             ← Global styles, Tailwind directives, utility classes
    │
    ├── context/
    │   └── AuthContext.jsx   ← Auth state, login(), logout() — swap mock with real API
    │
    ├── hooks/
    │   └── useToast.js       ← Lightweight toast notification hook
    │
    ├── utils/
    │   ├── helpers.js        ← cn(), formatDate(), getInitials(), pct()
    │   └── mockData.js       ← Mock data — replace with real API calls
    │
    ├── assets/               ← Drop your logo file here (e.g. vikasana-logo.svg)
    │
    ├── components/
    │   ├── LoginForm.jsx     ← Form logic (validation, submit, error states)
    │   ├── AddFacultyModal.jsx ← 2-step add faculty + email invite modal
    │   │
    │   ├── ui/               ← Reusable design system components
    │   │   ├── Icon.jsx         ← All SVG icons
    │   │   ├── Button.jsx       ← primary / secondary / ghost / danger variants
    │   │   ├── Input.jsx        ← Labelled input with icon + error
    │   │   ├── Modal.jsx        ← Accessible dialog overlay
    │   │   ├── Toast.jsx        ← Toast + ToastContainer
    │   │   ├── VikasanaLogo.jsx ← Logo component (swap src when ready)
    │   │   └── index.jsx        ← StatusBadge, StatCard, ProgressBar, Avatar, Card, Table, EmptyState
    │   │
    │   └── layout/
    │       ├── AdminLayout.jsx  ← Shell: sidebar + topbar + <Outlet />
    │       ├── Sidebar.jsx      ← Collapsible nav sidebar
    │       └── Topbar.jsx       ← Header with page title, date, notifications
    │
    └── pages/
        ├── LoginPage.jsx        ← Split-panel login screen
        ├── DashboardPage.jsx    ← Stats, progress charts, recent submissions
        ├── FacultyPage.jsx      ← Faculty list, search, add modal
        ├── StudentsPage.jsx     ← Student roster with filters
        ├── ActivitiesPage.jsx   ← Submission tracker with status/category filters
        ├── CertificatesPage.jsx ← Certificate progress + issued list
        └── NotFoundPage.jsx     ← 404
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

### Demo Credentials
```
Email:    admin@vikasanafoundation.org
Password: admin@2025
```

---

## 🖼️ Adding Your Logo

1. Place your logo file in `src/assets/` (e.g. `vikasana-logo.svg`)
2. Open `src/components/ui/VikasanaLogo.jsx`
3. Uncomment and update line 10:
   ```js
   const LOGO_SRC = null
   // ↓ change to:
   import logo from '@/assets/vikasana-logo.svg'
   const LOGO_SRC = logo
   ```

The component supports `variant="icon"` (icon only), `variant="default"` (icon + name), and `variant="full"` (icon + name + tagline).

---

## 🔌 Connecting to a Real Backend

### Authentication (`src/context/AuthContext.jsx`)
Replace the mock block in `login()`:
```js
// Replace this:
await new Promise((r) => setTimeout(r, 900))
if (email === '...' && password === '...') { ... }

// With your real API call:
const res = await fetch('/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const data = await res.json()
if (!res.ok) return { success: false, message: data.message }
setAdmin(data.admin)
sessionStorage.setItem('vf_admin', JSON.stringify(data.admin))
return { success: true }
```

### Add Faculty + Email Invite (`src/components/AddFacultyModal.jsx`)
Replace the mock block in `handleSubmit()`:
```js
// Replace setTimeout mock with:
const res = await fetch('/api/admin/faculty', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form),
})
// Your backend sends the activation email
```

### Mock Data (`src/utils/mockData.js`)
Replace each exported array with a custom hook or service that fetches from your API:
```js
// e.g. useFaculty hook using React Query or SWR
export const useFaculty = () => useQuery(['faculty'], () => fetch('/api/admin/faculty').then(r => r.json()))
```

---

## 🎨 Theming

All brand colours are defined in `tailwind.config.js` under `theme.extend.colors`:
- `brand.*` — Primary blue palette
- `gold.*`  — Accent gold
- `surface.*` — Background shades

Global CSS variables in `src/index.css` for non-Tailwind usage.

---

## 📦 Tech Stack

| Tool             | Purpose                      |
|------------------|------------------------------|
| React 18         | UI framework                 |
| Vite 5           | Build tool                   |
| Tailwind CSS 3   | Utility-first styling        |
| React Router 6   | Client-side routing          |
| Playfair Display | Display / heading font       |
| DM Sans          | Body font                    |

---

© 2025 Vikasana Foundation. All rights reserved.

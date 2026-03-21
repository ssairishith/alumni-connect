# 🎓 Alumni Chatspace

A full-stack community platform for students, alumni, and faculty — built with Next.js, React, and NeonDB.

---

## ✅ What's Fixed vs Your Previous Prototype

| Issue | Fix |
|---|---|
| User stayed logged in after server restart | Session cookie with **no `maxAge`** → clears on browser close. No localStorage used. |
| Slow data fetching / freezing | **SWR** caching + NeonDB serverless driver. Zero mock data. |
| Posts created but never appeared | All components fetch from DB via SWR. No Zustand data cache. |
| Users not connected in chat | **Polling-based real-time** (2s interval) via `/api/chat/messages?since=` |
| Login/logout flow broken across roles | Middleware reads JWT from `httpOnly` cookie. Roles separated at API level. |
| Mock data leftover | Zustand only manages **UI state** (active panel). All data lives in SWR. |

---

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone <your-repo>
cd alumni-chatspace
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL=postgresql://...   # from neon.tech
JWT_SECRET=<32+ random chars>    # openssl rand -base64 32
GROQ_API_KEY=gsk_...             # from console.groq.com
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=Admin@123456
```

### 3. Initialize database
```bash
npm run db:setup
```
This runs the schema SQL and creates your first admin account.

### 4. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Architecture

```
alumni-chatspace/
├── app/
│   ├── api/
│   │   ├── auth/          login · signup · logout · me
│   │   ├── posts/         list · create · react · comments
│   │   ├── chat/          messages (polling)
│   │   ├── mentorship/    CRUD + accept/reject
│   │   ├── notifications/ list + mark read
│   │   ├── alumni/        directory
│   │   ├── resume/        Groq AI parse
│   │   └── admin/         posts · faculty · logs
│   ├── globals.css        Syne + DM Sans · dark theme
│   ├── layout.tsx
│   └── page.tsx           ← traffic controller (auth/setup/app)
├── components/
│   ├── auth/              AuthPage · ProfileSetup
│   ├── layout/            AppLayout · Sidebar · MainContent
│   ├── posts/             PostFeed · PostCard · CreatePostModal
│   └── panels/            ChatPanel · AlumniDirectory · MentorshipPanel
│                          NotificationsPanel · AdminPanel
├── hooks/                 useAuth · usePosts · useNotifications · useChat
├── lib/                   db · auth · store · types
├── middleware.ts           JWT validation on all /api routes
└── scripts/               schema.sql · setup-db.js
```

---

## 👥 User Roles

| Role | How to get it | What they can do |
|---|---|---|
| **Student** | Sign up + graduation year ≥ current year | View/comment posts, request mentorship |
| **Alumni** | Sign up + graduation year < current year | Post (with approval), accept mentorship |
| **Faculty** | Sign up as Faculty tab | Post announcements (after admin approves account) |
| **Admin** | Created via `npm run db:setup` | Full admin panel: approve posts/faculty, view logs |

---

## 🔑 Session Behavior

- Session = **httpOnly cookie**, no `maxAge` → it's a **session cookie**
- When browser/tab closes → cookie gone → user must log in again
- No localStorage, no sessionStorage used anywhere

---

## ⚡ Real-Time Chat

Chat uses **2-second polling** via `GET /api/chat/messages?since=<timestamp>`.
- Initial load: last 50 messages
- Every 2s: only fetches messages newer than last known timestamp
- This is reliable, works everywhere, needs no WebSocket infrastructure

---

## 🤖 AI Resume Parsing

1. User uploads PDF in profile setup
2. PDF text extracted via `pdf-parse`
3. Text sent to **Groq Llama 3.3 70B**
4. Returns structured JSON: name, bio, graduation year, company, role, skills
5. Form pre-filled; user can edit before saving
6. Graduation year determines Student vs Alumni role automatically

---

## 🌱 NeonDB Setup

1. Go to [neon.tech](https://neon.tech) → create a project
2. Copy the connection string from Dashboard → Connection Details
3. Paste into `DATABASE_URL` in `.env.local`
4. Run `npm run db:setup` once

---

## 🔑 Groq Setup

1. Go to [console.groq.com](https://console.groq.com)
2. Create API key
3. Paste into `GROQ_API_KEY` in `.env.local`

> Resume parsing is optional — users can always fill manually.

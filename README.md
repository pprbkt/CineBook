# 🎬 CineBook

**A Real-Time Online Movie Ticket Booking and Seat Reservation System (Extended to Events)**

> Built by **Abhilasha A, Akash J, Darshan IC & Dhanush HS** — Dept. of CSE AI/ML, Vidyavardhaka College of Engineering

---

## ✨ Features

- 🎭 **Multi-Event Support** — Movies, Concerts, Sports, Theatre
- 🪑 **Real-Time Seat Selection** — Visual interactive seat map with live locking via Socket.io + Redis
- 🧠 **Smart Seat Recommendations** — AI-powered suggestions based on viewing angle, preferences, and history
- 🎯 **Personalized Event Recommendations** — Hybrid content-based + collaborative filtering
- 🌐 **3D Seat Preview** — React Three Fiber auditorium preview from any selected seat
- ⭐ **Reviews & Ratings** — Verified user reviews with aggregate ratings
- 🔐 **Secure Auth** — JWT + HttpOnly cookies + bcrypt + Zod validation
- 💳 **Payment Ready** — Razorpay integration (test mode)
- 🎟️ **Digital Tickets** — PDF with QR code generation
- 📧 **Email Notifications** — Booking confirmations via Nodemailer
- 🛡️ **Admin Panel** — Manage events, showtimes, bookings, venues
- 📱 **Responsive Design** — Mobile-first dark cinema theme
- 🐳 **Docker Support** — One-command deployment

---

## 🏗️ Architecture

```
3-Tier Architecture
├── Presentation Layer  →  React 19 + TypeScript + Vite + Tailwind CSS
├── Application Layer   →  Node.js + Express.js + Socket.io + Redis
└── Data Layer          →  MongoDB + Mongoose
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Zustand, Framer Motion, React Three Fiber |
| Backend | Node.js, Express.js, TypeScript, Socket.io, JWT, Zod |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io + Redis (with in-memory fallback) |
| 3D View | Three.js via @react-three/fiber + @react-three/drei |
| Tickets | pdf-lib + qrcode |
| Email | Nodemailer |
| DevOps | Docker + Docker Compose |

---

## 📁 Project Structure

```
cinebook/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, env config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, validation, errors
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (recommendations, tickets, email)
│   │   ├── socket/          # Socket.io handlers
│   │   ├── utils/           # Logger, validators, errors
│   │   ├── seed.ts          # Database seed script
│   │   └── server.ts        # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── stores/          # Zustand state stores
│   │   ├── lib/             # API client, Socket client
│   │   ├── hooks/           # Custom hooks
│   │   ├── App.tsx          # Root component with routing
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles + Tailwind
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — falls back to in-memory)

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/cinebook.git
cd cinebook

# Backend
cd backend
cp ../.env.example .env   # Edit .env with your values
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start MongoDB

```bash
# If using local MongoDB:
mongod

# Or use Docker:
docker run -d -p 27017:27017 --name cinebook-mongo mongo:7
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Open App

Visit **http://localhost:5173**

**Demo Credentials:**
- Admin: `admin@cinebook.app` / `password123`
- User: `dhanush@test.com` / `password123`

---

## 🐳 Docker Deployment

```bash
# One-command deployment
docker-compose up --build

# Seed data
docker exec cinebook-backend npm run seed
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/events` | List events (with filters) |
| GET | `/api/events/featured` | Featured events |
| GET | `/api/events/recommendations` | Personalized recommendations |
| GET | `/api/events/:id` | Event details + showtimes |
| GET | `/api/showtimes/:id` | Showtime with seat availability |
| GET | `/api/showtimes/:id/seat-recommendations` | Smart seat suggestions |
| POST | `/api/bookings` | Create booking |
| POST | `/api/bookings/:id/confirm` | Confirm payment |
| GET | `/api/bookings/my` | User's bookings |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/bookings/:id/ticket` | Download PDF ticket |
| POST | `/api/reviews` | Submit review |
| GET | `/api/reviews/event/:id` | Event reviews |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `showtime:join` | Client → Server | Join showtime room |
| `seat:lock` | Client → Server | Lock a seat |
| `seat:unlock` | Client → Server | Release a seat |
| `seat:locked` | Server → All | Broadcast seat locked |
| `seat:unlocked` | Server → All | Broadcast seat released |
| `seats:booked` | Server → All | Broadcast seats confirmed |

---

## 📊 Database Models

- **User** — Auth, profile, role (user/admin)
- **Event** — Movies, concerts, sports, theatre with metadata
- **Venue** — Theatre/hall with 3D seat layout
- **Showtime** — Event + venue + datetime + booked seats
- **Booking** — User + showtime + seats + payment + QR code
- **Review** — Ratings with verified booking flag
- **UserPreference** — Behavioral data for recommendations

---

## 🏗️ Deployment

### Vercel (Frontend)
```bash
cd frontend
npx vercel --prod
```

### Render / Railway (Backend)
- Set environment variables
- Build command: `npm run build`
- Start command: `npm start`

### MongoDB Atlas
- Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- Update `MONGODB_URI` in `.env`

---

## 📝 License

MIT License — Built for academic purposes at VVCE.

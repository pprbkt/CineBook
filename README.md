# CineBook

Real-time movie ticket booking and seat reservation system, extended to events — concerts, sports, theatre. Live seat locking, smart seat recommendations, 3D auditorium preview.

> Built by Abhilash A, Akash J, Darshan IC & Dhanush HS — Dept. of CSE (AI/ML), Vidyavardhaka College of Engineering

## ▌Overview

A 3-tier booking platform with real-time seat selection (locked across all connected clients via Socket.io), AI-assisted seat and event recommendations, 3D seat previews, digital tickets with QR codes, and a full admin panel — all containerized for one-command deployment.

## ▌Architecture

```
Presentation   React 19 + TypeScript + Vite + Tailwind CSS
Application    Node.js + Express + Socket.io + Redis
Data           MongoDB + Mongoose
```

## ▌Tech Stack

```
Frontend    React 19 • TypeScript • Vite • Tailwind CSS v4 • TanStack Query • Zustand • Framer Motion • React Three Fiber
Backend     Node.js • Express • TypeScript • Socket.io • JWT • Zod
Database    MongoDB • Mongoose
Real-time   Socket.io + Redis (in-memory fallback)
3D          Three.js via @react-three/fiber, @react-three/drei
Tickets     pdf-lib • qrcode
Email       Nodemailer
DevOps      Docker • Docker Compose
```

## ▌Features

- Multi-event support — movies, concerts, sports, theatre
- Real-time seat selection with live locking across clients
- Smart seat recommendations based on viewing angle, preferences, history
- Personalized event recommendations — hybrid content-based + collaborative filtering
- 3D seat preview — view the auditorium from any selected seat
- Reviews and ratings, tied to verified bookings
- JWT auth with HttpOnly cookies, bcrypt, Zod validation
- Razorpay integration (test mode)
- PDF tickets with QR codes
- Email confirmations via Nodemailer
- Admin panel for events, showtimes, bookings, venues
- Docker Compose for one-command deployment

## ▌Project Structure

```
cinebook/
├── backend/
│   ├── src/
│   │   ├── config/          DB, Redis, env config
│   │   ├── controllers/     Route handlers
│   │   ├── middleware/      Auth, validation, errors
│   │   ├── models/          Mongoose schemas
│   │   ├── routes/          API routes
│   │   ├── services/        Recommendations, tickets, email
│   │   ├── socket/          Socket.io handlers
│   │   ├── utils/           Logger, validators, errors
│   │   ├── seed.ts          Database seed script
│   │   └── server.ts        Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      Reusable UI components
│   │   ├── pages/           Route pages
│   │   ├── stores/          Zustand state
│   │   ├── lib/             API + socket clients
│   │   ├── hooks/           Custom hooks
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## ▌Setup

**Prerequisites:** Node.js 18+, MongoDB (local or Atlas), Redis (optional — falls back to in-memory)

```bash
git clone https://github.com/pprbkt/CineBook.git
cd CineBook

# Backend
cd backend
cp ../.env.example .env   # fill in your values
npm install

# Frontend
cd ../frontend
npm install
```

Start MongoDB:

```bash
mongod
# or
docker run -d -p 27017:27017 --name cinebook-mongo mongo:7
```

Seed the database:

```bash
cd backend
npm run seed
```

Run dev servers:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173`.

**Demo credentials**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cinebook.app` | `password123` |
| User | `dhanush@test.com` | `password123` |

## ▌Docker

```bash
docker-compose up --build
docker exec cinebook-backend npm run seed
```

## ▌API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/events` | List events (filterable) |
| GET | `/api/events/featured` | Featured events |
| GET | `/api/events/recommendations` | Personalized recommendations |
| GET | `/api/events/:id` | Event details + showtimes |
| GET | `/api/showtimes/:id` | Showtime + seat availability |
| GET | `/api/showtimes/:id/seat-recommendations` | Smart seat suggestions |
| POST | `/api/bookings` | Create booking |
| POST | `/api/bookings/:id/confirm` | Confirm payment |
| GET | `/api/bookings/my` | User's bookings |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/bookings/:id/ticket` | Download PDF ticket |
| POST | `/api/reviews` | Submit review |
| GET | `/api/reviews/event/:id` | Event reviews |

## ▌Socket Events

| Event | Direction | Description |
|---|---|---|
| `showtime:join` | Client → Server | Join showtime room |
| `seat:lock` | Client → Server | Lock a seat |
| `seat:unlock` | Client → Server | Release a seat |
| `seat:locked` | Server → All | Broadcast seat locked |
| `seat:unlocked` | Server → All | Broadcast seat released |
| `seats:booked` | Server → All | Broadcast seats confirmed |

## ▌Data Models

- **User** — auth, profile, role
- **Event** — movies, concerts, sports, theatre + metadata
- **Venue** — theatre/hall with 3D seat layout
- **Showtime** — event + venue + datetime + booked seats
- **Booking** — user + showtime + seats + payment + QR code
- **Review** — ratings, verified-booking flag
- **UserPreference** — behavioral data for recommendations

## ▌Deployment

```
Frontend    Vercel    npx vercel --prod
Backend     Render / Railway   build: npm run build · start: npm start
Database    MongoDB Atlas — set MONGODB_URI in .env
```

## ▌License

MIT — built for academic purposes at VVCE.

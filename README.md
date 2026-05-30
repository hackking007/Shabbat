# Shabbat App — אפליקציית שבת

Full-stack Hebrew web app for Shabbat times, parasha content, and a personal Shabbat-prep checklist.
Built with **Node.js + Express** (backend) and **React + Vite + TypeScript** (frontend).

---

## Quick start (התקנה והרצה מהירה)

```bash
# 1. Install backend dependencies (root)
npm install

# 2. Install frontend dependencies
cd client
npm install
cd ..

# 3. Copy environment template (defaults work as-is)
#    Windows PowerShell:  Copy-Item .env.example .env
#    macOS / Linux:       cp .env.example .env

# 4. Start BOTH server and client in one terminal
npm run dev
```

Then open **http://localhost:5173** in a browser.

The `npm run dev` script uses `concurrently` to run:
- Express API on `http://localhost:4000`
- Vite dev server on `http://localhost:5173` (with hot reload)

---

## Prerequisites

- **Node.js 18 or later** ([nodejs.org](https://nodejs.org))
- A modern browser

---

## Features

| Feature | Works out of the box? | Notes |
|---|---|---|
| Shabbat candle-lighting / havdalah times | ✅ Yes | Uses the free HebCal API |
| Parasha content (Dvar Torah, halacha, segula) | ✅ Yes | Falls back to built-in Hebrew content if no AI key |
| **AI-generated parasha content (Gemini)** | ⚙️ Optional | Add a Gemini key to `.env` for fresh AI content per parasha |
| User registration / login | ⚙️ Optional | Requires a running MongoDB |
| Personal Shabbat-prep checklist | ⚙️ Optional | Requires login (and therefore MongoDB) |

### Enable AI content (optional)

1. Get a free Google AI Studio API key: https://aistudio.google.com/apikey
2. Open `.env` and set: `GEMINI_API_KEY=your_key_here`
3. Restart `npm run dev`

### Enable login & checklist (optional)

Either:
- **Local MongoDB** — install MongoDB Community Edition and let it run on `mongodb://localhost:27017` (the default in `.env`), or
- **MongoDB Atlas (free cloud tier)** — create a cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), then replace `MONGO_URI` in `.env` with your connection string.

Without a database the app still loads — only the login and checklist sections will be inactive.

---

## Project structure

```
.
├── server.js                 # Express entry point
├── server/
│   ├── config/db.js          # MongoDB connection
│   ├── controllers/          # Route handlers (auth, shabbat, checklist)
│   ├── middlewares/          # JWT auth middleware
│   ├── models/               # Mongoose schemas
│   └── routes/               # Express routers
├── client/                   # React + Vite frontend
│   ├── src/App.tsx           # Main UI
│   └── dist/                 # Pre-built production bundle (also included in this zip)
├── .env.example              # Template — copy to .env
└── package.json              # Scripts: dev, server, client, start
```

---

## Available scripts (from project root)

| Command | What it does |
|---|---|
| `npm run dev`    | Run backend + frontend together (recommended for development) |
| `npm run server` | Run only the Express backend, with auto-restart on file changes |
| `npm run client` | Run only the Vite frontend dev server |
| `npm start`      | Run the backend once (no auto-restart) |

---

## Troubleshooting

- **Port 4000 or 5173 already in use** — change `PORT` in `.env`, or stop the conflicting process.
- **"Cannot connect to MongoDB"** — expected if you haven't installed MongoDB. Login and checklist will be disabled; the rest of the app still works.
- **No AI content shown** — that's by design when `GEMINI_API_KEY` is empty. The fallback Hebrew content appears instead. Add a key to `.env` to enable live AI generation.

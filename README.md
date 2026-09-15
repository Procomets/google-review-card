# Google Review Link Generator

> Convert any Google Maps business link into a direct Google Review link — instantly.

![Tech Stack](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4-black?logo=express)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)

---

## Overview

Paste any Google Maps business URL and get a clean, direct link that takes your customers straight to the Google review form — no manual searching required.

The Google API key **never** leaves the backend. It is stored in a `.env` file and never sent to the browser.

---

## Features

- ✅ Resolves shortened URLs (`maps.app.goo.gl`, `goo.gl/maps`)
- ✅ Extracts business name and coordinates from the Maps URL
- ✅ Calls **Google Places API (New)** — Text Search endpoint
- ✅ Intelligent business matching (name similarity + geographic distance)
- ✅ Asks the user to confirm when multiple matches exist
- ✅ Generates `https://search.google.com/local/writereview?placeid=...`
- ✅ One-click copy to clipboard
- ✅ Opens review page in new tab
- ✅ **24-hour in-memory cache** to avoid redundant API calls
- ✅ **Rate limiting** — 20 requests per IP per hour (protects your paid API quota)
- ✅ **SSRF protection** — only allows whitelisted Google domains
- ✅ API key secured server-side in `.env`
- ✅ Responsive, mobile-friendly UI with Tailwind CSS

---

## Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Frontend  | React 19 + Vite + Tailwind CSS |
| Backend   | Node.js + Express              |
| API       | Google Places API (New) — Text Search |
| HTTP      | axios (backend), native fetch (frontend) |

---

## Project Structure

```
google review card/
├── index.html
├── package.json          ← Frontend dependencies
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example          ← Frontend env template
├── .gitignore
├── src/
│   ├── main.jsx
│   ├── App.jsx           ← Main UI + state machine
│   ├── index.css         ← Tailwind + custom components
│   ├── api.js            ← API client (no key here!)
│   └── components/
│       ├── UrlInput.jsx        ← URL input form
│       ├── BusinessConfirm.jsx ← Multi-candidate picker
│       ├── ResultCard.jsx      ← Review link + copy/open
│       ├── ErrorBanner.jsx     ← Error display
│       └── Spinner.jsx         ← Loading indicator
└── backend/
    ├── server.js         ← Express API server
    ├── package.json      ← Backend dependencies
    ├── .env.example      ← Backend env template
    └── tests/
        └── api.test.js   ← 11 API tests
```

---

## Google Cloud Setup

### Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable billing for the project

### Step 2 — Enable the Places API (New)

1. Navigate to **APIs & Services → Library**
2. Search for **"Places API (New)"**
3. Click **Enable**

> ⚠️ Make sure you enable **Places API (New)**, not the legacy Places API.

### Step 3 — Create an API Key

1. Navigate to **APIs & Services → Credentials**
2. Click **+ Create Credentials → API key**
3. Copy the generated key

### Step 4 — Restrict the API Key (Recommended)

1. Click the pencil icon next to your API key
2. Under **API restrictions**, select **Restrict key**
3. Choose **Places API (New)**
4. Under **Application restrictions**, select **IP addresses** and add your server's IP
5. Click **Save**

---

## Configuration

### Backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
GOOGLE_API_KEY=AIzaSy...your_key_here...
PORT=5000
ALLOWED_ORIGIN=http://localhost:5173
```

### Frontend `.env`

```bash
# In the root frontend directory
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

> **Important:** The `VITE_API_BASE_URL` only points to *your* backend. The actual Google API key is never placed in any `VITE_*` variable.

---

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
# In the root directory (where package.json is)
npm install
```

---

## Running Locally

### Start the Backend

```bash
cd backend
npm run dev
```

Server starts on `http://localhost:5000`

### Start the Frontend

Open a second terminal:

```bash
# From the root directory
npm run dev
```

Frontend starts on `http://localhost:5173`

Open your browser at `http://localhost:5173`.

---

## Running Tests

Make sure the backend is running first, then:

```bash
cd backend
node tests/api.test.js
```

Expected output:

```
🧪  Running API tests...

  ✅  Health check returns 200 and status ok
  ✅  Empty URL returns 400
  ✅  Missing mapsUrl returns 400
  ✅  Non-Google URL returns 400
  ✅  Garbage URL returns 400
  ✅  URL > 2048 chars returns 400
  ✅  Valid google.com/maps URL is accepted
  ✅  maps.app.goo.gl URL passes SSRF whitelist check
  ✅  confirm-business with valid placeId returns reviewUrl
  ✅  confirm-business with empty placeId returns 400
  ✅  confirm-business rejects script-injected placeId

─────────────────────────────
  Tests passed: 11
  Tests failed: 0
─────────────────────────────
```

---

## API Endpoints

### `GET /api/health`
Returns server status.

### `POST /api/review-link`
**Request:**
```json
{ "mapsUrl": "https://maps.app.goo.gl/..." }
```

**Success Response (auto-matched):**
```json
{
  "success": true,
  "needsConfirmation": false,
  "business": {
    "name": "Business Name",
    "address": "123 Main St, City",
    "placeId": "ChIJ..."
  },
  "reviewUrl": "https://search.google.com/local/writereview?placeid=ChIJ..."
}
```

**Success Response (needs confirmation):**
```json
{
  "success": true,
  "needsConfirmation": true,
  "extractedName": "Business Name",
  "candidates": [
    {
      "name": "...",
      "address": "...",
      "placeId": "...",
      "distanceKm": 0.3
    }
  ]
}
```

### `POST /api/confirm-business`
**Request:**
```json
{
  "placeId": "ChIJ...",
  "name": "Business Name",
  "address": "123 Main St"
}
```
**Response:** Same success format as above.

---

## Production Deployment

### Backend

Deploy the `backend/` directory to any Node.js host:
- **Railway**, **Render**, **Fly.io**, **Heroku**, **AWS EC2**, **DigitalOcean**

Set these environment variables on your host:
```
GOOGLE_API_KEY=your_key
PORT=5000
ALLOWED_ORIGIN=https://your-frontend-domain.com
```

### Frontend

Build the static files:
```bash
npm run build
```

Deploy the `dist/` folder to:
- **Vercel**, **Netlify**, **Cloudflare Pages**, **GitHub Pages**

Set this environment variable:
```
VITE_API_BASE_URL=https://your-backend-domain.com
```

---

## API Key Security

| Rule | Status |
|------|--------|
| API key stored in `backend/.env` only | ✅ |
| API key never in React / Vite source | ✅ |
| API key never in `VITE_*` variables | ✅ |
| `.env` in `.gitignore` | ✅ |
| API key never in API responses or logs | ✅ |
| SSRF protection — only Google domains | ✅ |
| Rate limiting — 20 req / IP / hr | ✅ |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `GOOGLE_API_KEY is not set` | Copy `backend/.env.example` to `backend/.env` and add your key |
| `API key configuration error` | Check that **Places API (New)** is enabled in Google Cloud Console |
| `Business not found` | Try a full `google.com/maps` URL instead of a shortened link |
| `Rate limit reached` | Wait one hour or increase the limit in `server.js` |
| CORS errors in browser | Set `ALLOWED_ORIGIN` in `backend/.env` to match your frontend URL |
| Frontend can't reach backend | Check `VITE_API_BASE_URL` matches the backend address |

---

## Supported URL Formats

- `https://maps.app.goo.gl/...`
- `https://goo.gl/maps/...`
- `https://www.google.com/maps/place/...`
- `https://maps.google.com/maps/place/...`

---

## Private Feedback Module

The Private Feedback module allows you to create custom feedback pages for your business. Customers can leave a 5-star rating, and if they rate you highly (above a configurable threshold), they will be prompted to leave a Google Review.

**Note:** Customer feedback messages and ratings are not permanently stored to ensure maximum privacy and minimize data storage needs.

### Setup Instructions

The Private Feedback module requires a Firebase database to store your Feedback Page configurations.

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** in test or production mode.
3. Go to **Project Settings** > **Service Accounts** and generate a new private key.
4. Open the downloaded JSON file, copy its contents.
5. In `backend/.env`, add the following variables:
   ```env
   ADMIN_PASSWORD=your_secure_admin_password
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"... (paste the entire JSON here)"}'
   ```
   *Alternatively, if running locally or via a standard Google Cloud environment, you can rely on Default Application Credentials without setting `FIREBASE_SERVICE_ACCOUNT`.*

### Admin Dashboard

Access the dashboard at `/admin`.
- Default login password is `admin123` (configurable via `ADMIN_PASSWORD` env variable).
- You can create, edit, and disable feedback pages here.
- For each page, a secure short link is generated (e.g. `/f/K7mP2x`), which you can share with your customers.

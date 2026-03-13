# 🔗 URL Shortener Service (Node.js + PostgreSQL)

A production-ready **URL shortener backend** built with **Node.js 20**, **Express**, and **PostgreSQL**, designed for deployment on **AWS App Runner** with an **AWS RDS PostgreSQL** database.

The repository still contains the original Java/Spring Boot implementation, but the **primary production path is now the Node.js backend** described below.

---

## ✨ Features

- **Short URL creation** via `POST /shorten`
- **HTTP redirect** via `GET /:code` (returns `302 Found`)
- **Click tracking** stored in PostgreSQL
- **Input validation** for URLs and short codes
- **Centralized error handling** for database and application errors
- **Health endpoint** via `GET /health-check`

---

## 🧱 Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express
- **Database**: PostgreSQL (AWS RDS)
- **ID generation**: `nanoid` (collision-resistant short codes)
- **Database driver**: `pg`
- **Config**: `dotenv`

---

## 📦 Project Structure (Node backend)

```text
src/
  config/
    db.js              # PostgreSQL pool + schema bootstrap
  controllers/
    urlController.js   # Request handlers for /shorten and /:code
  routes/
    urlRoutes.js       # Express routes wiring
  services/
    urlService.js      # Database access + business logic
  middleware/
    errorHandler.js    # Centralized error handling
  utils/
    validateUrl.js     # URL validation helper
  index.js             # Express app entrypoint
```

---

## 🗄️ Database Schema (PostgreSQL)

Table: `urls`

- `id` `SERIAL PRIMARY KEY`
- `short_code` `VARCHAR` **UNIQUE NOT NULL**
- `original_url` `TEXT NOT NULL`
- `created_at` `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `clicks` `INTEGER NOT NULL DEFAULT 0`

The table is created automatically on startup by `src/config/db.js`:

- `CREATE TABLE IF NOT EXISTS urls (...)`

---

## 🌐 API Reference

### 1) Create a short URL

**`POST /shorten`**

#### Request body

```json
{
  "url": "https://example.com/some/very/long/path"
}
```

#### Notes

- `url` is required and must be a valid `http` or `https` URL.

#### Success response (`201 Created`)

```json
{
  "shortUrl": "https://your-domain.com/abc123xy",
  "shortCode": "abc123xy",
  "originalUrl": "https://example.com/some/very/long/path",
  "createdAt": "2026-01-01T10:00:00Z",
  "clicks": 0
}
```

---

### 2) Redirect using short code

**`GET /:code`**

#### Behavior

- Looks up the record by `short_code`.
- Increments the `clicks` counter.
- Returns **`302 Found`** and redirects to `original_url`.
- If not found, returns `404` with JSON `{ "error": "Short URL not found." }`.

---

### 3) Health check

**`GET /health-check`**

#### Response

```json
{
  "status": "UP",
  "message": "Backend is reachable!"
}
```

---

## ⚙️ Configuration (Environment Variables)

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname
BASE_URL=http://localhost:3000
```

- **`PORT`**: Port the Express server listens on (default `3000`).
- **`DATABASE_URL`**: PostgreSQL connection string (for AWS RDS use the URL provided by AWS).
- **`BASE_URL`**: Optional; if set, responses use this for `shortUrl` (otherwise inferred from the incoming request).

---

## 🚀 Running Locally

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or RDS)

### Steps

```bash
cp .env.example .env
# Edit DATABASE_URL to point to your local Postgres or RDS instance

npm install
npm start
```

Server will start on `http://0.0.0.0:3000` (or the `PORT` you configured).

---

## 🐳 Docker (AWS App Runner Ready)

The `Dockerfile` is configured for Node.js and AWS App Runner:

- Base image `node:20-alpine`
- Installs production dependencies
- Exposes port `3000`
- Runs `npm start`

Build and run locally:

```bash
docker build -t url-shortener-node .
docker run --env-file .env -p 3000:3000 --name url-shortener-node url-shortener-node
```

---

## 🚢 Deploying to AWS App Runner

1. **Create an RDS PostgreSQL instance**
   - Note the connection string, e.g.:
     `postgresql://user:password@host:5432/dbname`

2. **Push this repository to a Git provider** (GitHub, CodeCommit, etc.).

3. **Create an App Runner service**
   - Source: this repo (via App Runner’s “Source code repository” option) or a container image built from the `Dockerfile`.
   - Build & run command:
     - Build: App Runner uses the `Dockerfile` in the project root.
     - Run: `npm start` (already set as container CMD).

4. **Configure environment variables in App Runner**
   - `PORT=3000`
   - `DATABASE_URL=postgresql://user:password@host:5432/dbname`
   - Optionally, `BASE_URL=https://<your-app-runner-host>.awsapprunner.com`

5. **Deploy**
   - Once deployed, your base URL will be something like:
     `https://xxxxx.awsapprunner.com`
   - Example:
     - `POST https://xxxxx.awsapprunner.com/shorten`
     - `GET https://xxxxx.awsapprunner.com/abc123xy`

---

## 📁 Legacy Java Backend

The original Spring Boot backend (Java 17) is still present under:

```text
src/main/java/com/example/urlshortener
```

It is no longer the primary deployment target but can be used for reference or removed if you only want the Node.js implementation.

---

## 📄 License

This project is licensed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.


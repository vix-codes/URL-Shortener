# 🔗 URL Shortener Service

A production-ready **URL shortener backend + lightweight frontend** built with **Spring Boot 3** and **Java 17**.

It lets you:
- Create short links from long URLs.
- Use custom aliases (e.g., `/docs`).
- Set optional expiration dates.
- Redirect users quickly via short codes.
- Track click analytics per short URL.
- Reuse existing codes for duplicate non-expiring URLs.
- Protect the API with basic per-IP rate limiting.

---

## ✨ Features

- **Short URL creation** via `POST /shorten`
- **HTTP redirect** via `GET /{shortCode}` (returns `302 Found`)
- **Analytics endpoint** via `GET /analytics/{shortCode}`
- **Custom alias support** (`alias` in request)
- **Expiration support** (`expiresAt` in request)
- **Validation + friendly error responses**
- **In-memory rate limiter** (`120 requests/minute/IP`)
- **Cache-enabled lookup** for short code resolution
- **Health endpoint** via `GET /health-check`
- **Simple frontend** in `/frontend` for shortening and analytics

---

## 🧱 Tech Stack

### Backend
- Java 17
- Spring Boot 3.3
- Spring Web
- Spring Data JPA
- Spring Validation
- Spring Cache

### Data & Cache
- **Default local profile:** H2 in-memory database + simple cache
- **Container/deploy profile:** PostgreSQL + Redis-compatible cache settings

### DevOps
- Maven
- Docker / Docker Compose
- Vercel + Render deployment configs included

---

## 📡 API Reference

### 1) Create a short URL
`POST /shorten`

#### Request body
```json
{
  "url": "https://example.com/some/very/long/path",
  "alias": "optional-custom-code",
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

#### Notes
- `url` is required and must be a valid `http` or `https` URL.
- `alias` is optional. If provided, it must be unique.
- `expiresAt` is optional. If provided, it must be in the future.

#### Success response (`201 Created`)
```json
{
  "shortUrl": "http://localhost:8080/abc12",
  "shortCode": "abc12",
  "longUrl": "https://example.com/some/very/long/path"
}
```

---

### 2) Redirect using short code
`GET /{shortCode}`

#### Behavior
- Returns **`302 Found`**.
- Sets `Location` header to the original URL.
- Increments click count.
- If code is not found or expired, returns `404`.

---

### 3) Get analytics
`GET /analytics/{shortCode}`

#### Success response (`200 OK`)
```json
{
  "shortCode": "abc12",
  "clickCount": 42,
  "createdAt": "2026-01-01T10:00:00Z",
  "expiresAt": "2027-01-01T00:00:00Z",
  "longUrl": "https://example.com/some/very/long/path"
}
```

---

### 4) Health check
`GET /health-check`

#### Response
```json
{
  "status": "UP",
  "message": "Backend is reachable!"
}
```

---

## ⚠️ Rate Limiting

All non-`OPTIONS` requests are limited to:
- **120 requests per minute per client IP**

When exceeded:
- HTTP `429 Too Many Requests`
- Response body:
```json
{"message":"Rate limit exceeded"}
```

---

## 🚀 Running Locally

### Prerequisites
- Java 17+
- Maven 3.9+

### Start backend
```bash
mvn spring-boot:run
```

Backend starts at:
- `http://localhost:8080`

### Run tests
```bash
mvn test
```

---

## 🐳 Run with Docker Compose

This starts the app with containerized dependencies.

```bash
docker compose up --build
```

---

## 🌐 Frontend

A static UI is included in the `frontend/` folder:
- `index.html`
- `style.css`
- `app.js`

It supports:
- Creating short URLs
- Checking analytics by short URL or short code
- Copying generated links to clipboard

You can serve it with any static server.

---

## ⚙️ Configuration

Key environment variables:

- `PORT` (default: `8080`)
- `APP_BASE_URL` (default: `http://localhost:8080`)
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO` (default: `update`)
- `SPRING_CACHE_TYPE` (default: `simple`)
- `SPRING_DATA_REDIS_HOST`
- `SPRING_DATA_REDIS_PORT`
- `ALLOWED_ORIGINS` (CSV list for CORS)

---

## 🚢 Deployment

### Render
This repo includes deployment helpers (`DEPLOYMENT.md` and container files).

### Vercel
- Root `vercel.json` for backend container deployment
- `frontend/vercel.json` for frontend deployment flow

---

## 📁 Project Structure

```text
src/main/java/com/example/urlshortener
├── config/                 # MVC config, CORS, interceptors
├── controller/             # REST endpoints + global exception handling
├── dto/                    # Request/response DTOs
├── entity/                 # JPA entity
├── exception/              # Custom exceptions
├── repository/             # Data access
├── service/                # Core business logic
└── web/                    # Interceptors (rate limiter)
```

---

## 📄 MIT License

This project is licensed under the **MIT License**.

See the full license text in [`LICENSE`](./LICENSE).


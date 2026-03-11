# URL Shortener Service

Spring Boot implementation of a scalable URL shortener with:
- Short URL generation using Base62
- Redirect endpoint with cache-backed lookup
- Custom aliases
- Expiration support
- Click analytics
- Duplicate URL prevention (same non-expiring long URL reuses code)
- Basic rate limiting (per-IP, per-minute)

## Tech stack
- Java 17 + Spring Boot 3
- PostgreSQL (docker profile)
- Redis (docker profile cache)
- H2 (default local profile for quick run/tests)
- Docker / Docker Compose

## API
### Create short URL
`POST /shorten`

Request:
```json
{
  "url": "https://google.com/search?q=ai",
  "alias": "optional-custom-code",
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

Response:
```json
{
  "shortUrl": "http://localhost:8080/aZ91K",
  "shortCode": "aZ91K",
  "longUrl": "https://google.com/search?q=ai"
}
```

### Redirect
`GET /{shortCode}`

Response: `302 Found` with `Location` header.

### Analytics
`GET /analytics/{shortCode}`

Response includes `clickCount`, `createdAt`, `expiresAt`, and `longUrl`.

## Run locally
```bash
mvn spring-boot:run
```

## Run with Docker (Postgres + Redis)
```bash
docker compose up --build
```

## Render deployment
1. Push this repo to GitHub.
2. In Render, create a **Blueprint** and point it to the repo.
3. Render will use `render.yaml` to create:
   - Web service (`url-shortener-api`)
   - PostgreSQL (`url-shortener-db`)
   - Redis (`url-shortener-redis`)
4. Set `APP_BASE_URL` in Render to your Render API URL (e.g. `https://url-shortener-api.onrender.com`).
5. Use `/actuator/health` for health checks.

## Vercel deployment (edge proxy in front of Render)
1. Import this repo into Vercel.
2. Deploy with the included `vercel.json`.
3. Update the rewrite destination in `vercel.json` from `https://url-shortener-api.onrender.com` to your actual Render backend URL.
4. (Optional) Add custom domain in Vercel and point users to that domain.

> Note: Vercel is used here as the public edge/domain layer; the Spring Boot runtime is hosted on Render.

## Tests
```bash
mvn test
```

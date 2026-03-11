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

## Run tests
```bash
mvn test
```

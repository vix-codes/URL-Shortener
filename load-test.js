import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
export const shortenLatency = new Trend('shorten_latency_ms');
export const redirectLatency = new Trend('redirect_latency_ms');
export const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Warm up to 10 VUs
    { duration: '20s', target: 50 },   // Ramp up to 50 VUs
    { duration: '30s', target: 200 },  // Peak load at 200 VUs
    { duration: '10s', target: 0 },    // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],     // Error rate should be less than 5%
    http_req_duration: ['p(95)<300'],   // 95% of requests should respond under 300ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8080';

// Pool of short codes created during test
const createdShortCodes = ['default-code'];

export default function () {
  const isCreateRequest = Math.random() < 0.2; // 20% POST /shorten, 80% GET /:code

  if (isCreateRequest) {
    // 1. URL Creation (Write Path)
    const targetUrl = `https://example.com/item/${Math.floor(Math.random() * 1000000)}`;
    const payload = JSON.stringify({ url: targetUrl });
    const params = { headers: { 'Content-Type': 'application/json' } };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/shorten`, payload, params);
    shortenLatency.add(Date.now() - startTime);
    totalRequests.add(1);

    const success = check(res, {
      'POST /shorten status is 201': (r) => r.status === 201,
      'POST /shorten has shortCode': (r) => {
        try {
          const body = JSON.parse(r.body);
          if (body.shortCode) {
            createdShortCodes.push(body.shortCode);
            return true;
          }
        } catch (e) {}
        return false;
      },
    });
  } else {
    // 2. URL Redirect Lookup (Read Path)
    const randomCode = createdShortCodes[Math.floor(Math.random() * createdShortCodes.length)];

    const startTime = Date.now();
    // Redirects are 302, so pass redirects: 0 to measure exact redirect lookup speed
    const res = http.get(`${BASE_URL}/${randomCode}`, { redirects: 0 });
    redirectLatency.add(Date.now() - startTime);
    totalRequests.add(1);

    check(res, {
      'GET /:code status is 302 or 404': (r) => r.status === 302 || r.status === 404,
    });
  }

  sleep(0.05); // 50ms pacing between iterations
}

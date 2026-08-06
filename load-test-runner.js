const http = require('http');

const TARGET_HOST = process.env.TARGET_HOST || '127.0.0.1';
const TARGET_PORT = parseInt(process.env.TARGET_PORT || '3000', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const DURATION_SEC = parseInt(process.env.DURATION || '10', 10);

console.log(`🚀 Starting Node.js Load Benchmark against http://${TARGET_HOST}:${TARGET_PORT}`);
console.log(`Config: Concurrency=${CONCURRENCY}, Duration=${DURATION_SEC}s\n`);

let totalRequests = 0;
let successRequests = 0;
let errorRequests = 0;
const latencies = [];
const shortCodes = [];

function httpRequest(options, postData) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({ statusCode: res.statusCode, duration, body });
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      resolve({ statusCode: 500, duration, error: err.message });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runWorker(endTime) {
  while (Date.now() < endTime) {
    const isWrite = Math.random() < 0.2;
    totalRequests += 1;

    if (isWrite) {
      const payload = JSON.stringify({ url: `https://example.com/item/${Math.floor(Math.random() * 1000000)}` });
      const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: '/shorten',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const res = await httpRequest(options, payload);
      latencies.push(res.duration);
      if (res.statusCode === 201) {
        successRequests += 1;
        try {
          const data = JSON.parse(res.body);
          if (data.shortCode) shortCodes.push(data.shortCode);
        } catch (e) {}
      } else {
        errorRequests += 1;
      }
    } else {
      const code = shortCodes.length > 0
        ? shortCodes[Math.floor(Math.random() * shortCodes.length)]
        : 'testcode';

      const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: `/${code}`,
        method: 'GET',
      };

      const res = await httpRequest(options);
      latencies.push(res.duration);
      if (res.statusCode === 302 || res.statusCode === 404) {
        successRequests += 1;
      } else {
        errorRequests += 1;
      }
    }
  }
}

async function main() {
  // Warmup request
  const warmup = await httpRequest({ hostname: TARGET_HOST, port: TARGET_PORT, path: '/health-check', method: 'GET' });
  if (warmup.statusCode !== 200) {
    console.error(`❌ Health check failed with status ${warmup.statusCode}: ${warmup.error || 'Server unreachable'}`);
    process.exit(1);
  }
  console.log('✅ Server health check passed.');

  const startTime = Date.now();
  const endTime = startTime + (DURATION_SEC * 1000);

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i += 1) {
    workers.push(runWorker(endTime));
  }

  await Promise.all(workers);
  const totalDurationSec = (Date.now() - startTime) / 1000;

  latencies.sort((a, b) => a - b);
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (totalRequests / totalDurationSec).toFixed(2);

  console.log('\n📊 === BENCHMARK RESULTS ===');
  console.log(`Total Duration: ${totalDurationSec.toFixed(2)}s`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful Requests: ${successRequests}`);
  console.log(`Failed Requests: ${errorRequests}`);
  console.log(`Throughput (RPS): ${rps} req/sec`);
  console.log(`Average Latency: ${avgLatency} ms`);
  console.log(`p50 Latency: ${p50} ms`);
  console.log(`p95 Latency: ${p95} ms`);
  console.log(`p99 Latency: ${p99} ms`);
  console.log('============================\n');
}

main();

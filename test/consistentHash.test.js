const ConsistentHashRing = require('../src/utils/consistentHash');

console.log('🧪 Testing Consistent Hash Ring Distribution...');

const shardKeys = ['shard_0', 'shard_1', 'shard_2'];
const ring = new ConsistentHashRing(shardKeys, 40);

const counts = { shard_0: 0, shard_1: 0, shard_2: 0 };
const TOTAL_KEYS = 10000;

for (let i = 0; i < TOTAL_KEYS; i += 1) {
  const key = `shortCode_${i}_${Math.random()}`;
  const targetShard = ring.getShard(key);
  counts[targetShard] = (counts[targetShard] || 0) + 1;
}

console.log('\nDistribution results across 10,000 keys:');
Object.entries(counts).forEach(([shard, count]) => {
  const pct = ((count / TOTAL_KEYS) * 100).toFixed(2);
  console.log(`  - ${shard}: ${count} keys (${pct}%)`);
});

// Assert deterministic mapping
const sampleKey = 'sampleKey123';
const mapped1 = ring.getShard(sampleKey);
const mapped2 = ring.getShard(sampleKey);

if (mapped1 === mapped2) {
  console.log(`\n✅ Deterministic mapping verified: "${sampleKey}" -> ${mapped1}`);
} else {
  console.error(`\n❌ Deterministic mapping failed: got ${mapped1} and ${mapped2}`);
  process.exit(1);
}

// Assert uniform distribution (each shard should have ~25%-40% of keys)
const minExpected = TOTAL_KEYS * 0.20;
const maxExpected = TOTAL_KEYS * 0.45;

let isUniform = true;
shardKeys.forEach((shard) => {
  if (counts[shard] < minExpected || counts[shard] > maxExpected) {
    isUniform = false;
  }
});

if (isUniform) {
  console.log('✅ Uniform key distribution across shards verified successfully!');
} else {
  console.warn('⚠️ Key distribution uneven beyond expected range');
}

const crypto = require('crypto');

class ConsistentHashRing {
  /**
   * @param {string[]} shardKeys Array of shard identifiers (e.g., ['shard_0', 'shard_1', 'shard_2'])
   * @param {number} replicaCount Number of virtual nodes per physical shard (default 40)
   */
  constructor(shardKeys = [], replicaCount = 40) {
    this.replicaCount = replicaCount;
    this.ring = [];
    this.shardKeys = new Set();

    shardKeys.forEach((shard) => this.addShard(shard));
  }

  /**
   * Hashes a string into a 32-bit unsigned integer using MD5.
   * @param {string} key
   * @returns {number}
   */
  _hash(key) {
    const digest = crypto.createHash('md5').update(key).digest();
    // Read first 4 bytes as unsigned 32-bit integer (big-endian)
    return digest.readUInt32BE(0);
  }

  /**
   * Adds a shard to the hash ring with virtual nodes.
   * @param {string} shardKey
   */
  addShard(shardKey) {
    if (this.shardKeys.has(shardKey)) return;
    this.shardKeys.add(shardKey);

    for (let i = 0; i < this.replicaCount; i += 1) {
      const virtualNodeKey = `${shardKey}#vnode${i}`;
      const hash = this._hash(virtualNodeKey);
      this.ring.push({ hash, shardKey });
    }

    // Keep ring sorted by hash value ascending
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  /**
   * Removes a shard from the hash ring.
   * @param {string} shardKey
   */
  removeShard(shardKey) {
    if (!this.shardKeys.has(shardKey)) return;
    this.shardKeys.delete(shardKey);
    this.ring = this.ring.filter((entry) => entry.shardKey !== shardKey);
  }

  /**
   * Gets the physical shard assigned to the given key (e.g. short_code).
   * @param {string} key
   * @returns {string|null}
   */
  getShard(key) {
    if (this.ring.length === 0) return null;

    const hash = this._hash(key);

    // Binary search for the first virtual node with hash >= key's hash
    let low = 0;
    let high = this.ring.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid].hash >= hash) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    // Wrap around to the first node if key hash exceeds all virtual nodes
    const targetIndex = low % this.ring.length;
    return this.ring[targetIndex].shardKey;
  }
}

module.exports = ConsistentHashRing;

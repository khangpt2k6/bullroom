const Redis = require('ioredis');

// Initialize Redis client for Upstash
const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false // Required for Upstash
  },
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// Helper functions for room booking
const RoomCache = {
  // Check if room is available
  async isAvailable(roomId, timeSlot) {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const status = await redis.get(key);
    return status === null || status === 'AVAILABLE';
  },

  // Hold a room (with TTL)
  async holdRoom(roomId, timeSlot, userId, ttlSeconds = 600) {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const holdKey = `room:${roomId}:hold:${userId}`;

    // Try to set the room as HELD only if it doesn't exist (SETNX)
    const result = await redis.set(key, 'HELD', 'EX', ttlSeconds, 'NX');

    if (result === 'OK') {
      await redis.set(holdKey, userId, 'EX', ttlSeconds);
      return true;
    }
    return false; // Room already held/booked
  },

  // Confirm booking
  async confirmBooking(roomId, timeSlot, userId) {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const holdKey = `room:${roomId}:hold:${userId}`;

    // Set room as BOOKED (no expiry)
    await redis.set(key, 'BOOKED');
    await redis.del(holdKey);

    // Publish event for real-time updates
    await redis.publish('room:updates', JSON.stringify({
      roomId,
      timeSlot,
      status: 'BOOKED',
      userId
    }));

    return true;
  },

  // Release room (cancel booking/hold)
  async releaseRoom(roomId, timeSlot, userId) {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const holdKey = `room:${roomId}:hold:${userId}`;

    await redis.del(key);
    await redis.del(holdKey);

    // Publish event
    await redis.publish('room:updates', JSON.stringify({
      roomId,
      timeSlot,
      status: 'AVAILABLE'
    }));

    return true;
  },

  // Get room status
  async getRoomStatus(roomId, timeSlot) {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const status = await redis.get(key);
    return status || 'AVAILABLE';
  }
};

module.exports = { redis, RoomCache };

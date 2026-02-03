import Redis from 'ioredis';
import { RoomUpdateEvent } from '../types';

const redis = new Redis(process.env.REDIS_URL as string, {
  tls: {
    rejectUnauthorized: false // Required for Upstash
  },
  retryStrategy: (times: number): number | void => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err: Error) => {
  console.error('❌ Redis connection error:', err.message);
});

// Helper functions for room booking
const RoomCache = {
  // Check if room is available
  async isAvailable(roomId: string, timeSlot: string): Promise<boolean> {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const status = await redis.get(key);
    return status === null || status === 'AVAILABLE';
  },

  // Hold a room (with TTL)
  async holdRoom(
    roomId: string,
    timeSlot: string,
    userId: string,
    ttlSeconds: number = 600
  ): Promise<boolean> {
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
  async confirmBooking(
    roomId: string,
    timeSlot: string,
    userId: string,
    bookingEndTime?: string
  ): Promise<boolean> {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const holdKey = `room:${roomId}:hold:${userId}`;

    // Set room as BOOKED (no expiry)
    await redis.set(key, 'BOOKED');
    await redis.del(holdKey);

    // Publish event for real-time updates
    const event: RoomUpdateEvent = {
      roomId,
      timeSlot,
      status: 'BOOKED',
      userId,
      bookingEndTime
    };

    await redis.publish('room:updates', JSON.stringify(event));

    return true;
  },

  // Release room (cancel booking/hold)
  async releaseRoom(
    roomId: string,
    timeSlot: string,
    userId: string
  ): Promise<boolean> {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const holdKey = `room:${roomId}:hold:${userId}`;

    await redis.del(key);
    await redis.del(holdKey);

    // Publish event
    const event: RoomUpdateEvent = {
      roomId,
      timeSlot,
      status: 'AVAILABLE'
    };

    await redis.publish('room:updates', JSON.stringify(event));

    return true;
  },

  // Get room status
  async getRoomStatus(roomId: string, timeSlot: string): Promise<string> {
    const key = `room:${roomId}:slot:${timeSlot}`;
    const status = await redis.get(key);
    return status || 'AVAILABLE';
  }
};

export { redis, RoomCache };

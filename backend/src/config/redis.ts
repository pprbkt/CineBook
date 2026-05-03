import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redis: Redis;

try {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (err) => {
    logger.warn('Redis connection error (will operate without caching):', err.message);
  });
} catch {
  logger.warn('Redis not available, seat locking will use in-memory fallback');
  redis = null as unknown as Redis;
}

export { redis };

// In-memory fallback for seat locks when Redis is unavailable
const memoryLocks = new Map<string, { userId: string; expiry: number }>();

export const seatLockManager = {
  async lockSeat(showtimeId: string, seatId: string, userId: string, ttlSeconds = 300): Promise<boolean> {
    const key = `seat_lock:${showtimeId}:${seatId}`;
    
    if (redis && redis.status === 'ready') {
      const existing = await redis.get(key);
      if (existing) {
        const data = JSON.parse(existing);
        if (data.userId !== userId) return false;
      }
      await redis.setex(key, ttlSeconds, JSON.stringify({ userId, expiry: Date.now() + ttlSeconds * 1000 }));
      return true;
    }
    
    // In-memory fallback
    const existing = memoryLocks.get(key);
    if (existing && existing.expiry > Date.now() && existing.userId !== userId) {
      return false;
    }
    memoryLocks.set(key, { userId, expiry: Date.now() + ttlSeconds * 1000 });
    setTimeout(() => memoryLocks.delete(key), ttlSeconds * 1000);
    return true;
  },

  async unlockSeat(showtimeId: string, seatId: string, userId: string): Promise<boolean> {
    const key = `seat_lock:${showtimeId}:${seatId}`;
    
    if (redis && redis.status === 'ready') {
      const existing = await redis.get(key);
      if (existing) {
        const data = JSON.parse(existing);
        if (data.userId !== userId) return false;
        await redis.del(key);
        return true;
      }
      return true;
    }
    
    const existing = memoryLocks.get(key);
    if (existing && existing.userId !== userId) return false;
    memoryLocks.delete(key);
    return true;
  },

  async getSeatLocks(showtimeId: string): Promise<Record<string, string>> {
    const pattern = `seat_lock:${showtimeId}:*`;
    const locks: Record<string, string> = {};
    
    if (redis && redis.status === 'ready') {
      const keys = await redis.keys(pattern);
      for (const key of keys) {
        const value = await redis.get(key);
        if (value) {
          const data = JSON.parse(value);
          const seatId = key.split(':').pop()!;
          locks[seatId] = data.userId;
        }
      }
    } else {
      for (const [key, value] of memoryLocks) {
        if (key.startsWith(`seat_lock:${showtimeId}:`) && value.expiry > Date.now()) {
          const seatId = key.split(':').pop()!;
          locks[seatId] = value.userId;
        }
      }
    }
    
    return locks;
  },

  async unlockAllForUser(showtimeId: string, userId: string): Promise<void> {
    const pattern = `seat_lock:${showtimeId}:*`;
    
    if (redis && redis.status === 'ready') {
      const keys = await redis.keys(pattern);
      for (const key of keys) {
        const value = await redis.get(key);
        if (value) {
          const data = JSON.parse(value);
          if (data.userId === userId) {
            await redis.del(key);
          }
        }
      }
    } else {
      for (const [key, value] of memoryLocks) {
        if (key.startsWith(`seat_lock:${showtimeId}:`) && value.userId === userId) {
          memoryLocks.delete(key);
        }
      }
    }
  },
};

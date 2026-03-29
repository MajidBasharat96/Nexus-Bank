import { createClient, RedisClientType } from 'redis';
import { config } from './app.config';
import { logger } from './logger.config';

let redisClient: RedisClientType;
let isRedisConnected = false;

export class RedisClient {
  static async connect(): Promise<void> {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port
      },
      password: config.redis.password || undefined,
      database: config.redis.db
    }) as RedisClientType;

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('Redis connected');
    });

    await redisClient.connect();
  }

  static isConnected(): boolean {
    return isRedisConnected;
  }

  static async get(key: string): Promise<string | null> {
    if (!isRedisConnected) return null;
    return redisClient.get(key);
  }

  static async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!isRedisConnected) return;
    if (ttl) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }
  }

  static async del(key: string): Promise<void> {
    if (!isRedisConnected) return;
    await redisClient.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    if (!isRedisConnected) return false;
    const result = await redisClient.exists(key);
    return result === 1;
  }

  static async incr(key: string): Promise<number> {
    if (!isRedisConnected) return 0;
    return redisClient.incr(key);
  }

  static async expire(key: string, seconds: number): Promise<void> {
    if (!isRedisConnected) return;
    await redisClient.expire(key, seconds);
  }

  static async hset(key: string, field: string, value: string): Promise<void> {
    if (!isRedisConnected) return;
    await redisClient.hSet(key, field, value);
  }

  static async hget(key: string, field: string): Promise<string | undefined> {
    if (!isRedisConnected) return undefined;
    return redisClient.hGet(key, field);
  }

  static async keys(pattern: string): Promise<string[]> {
    if (!isRedisConnected) return [];
    return redisClient.keys(pattern);
  }

  static async disconnect(): Promise<void> {
    if (redisClient) {
      await redisClient.quit();
      isRedisConnected = false;
    }
  }
}

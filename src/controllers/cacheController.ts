import { Request, Response } from 'express';
import { LRUCache } from '../cache/LRUCache';
import { RequestQueue } from '../queue/RequestQueue';
import { User } from '../helper';

let userCache: LRUCache<number, User>;
let requestQueue: RequestQueue;

export const initializeCacheController = (
  cache: LRUCache<number, User>,
  queue: RequestQueue
): void => {
  userCache = cache;
  requestQueue = queue;
};

export const clearCacheController = (_req: Request, res: Response): void => {
  userCache.clear();

  res.json({
    message: 'Cache cleared successfully',
  });
};

export const getCacheStatusController = (_req: Request, res: Response): void => {
  const stats = userCache.getStats();
  const queueStatus = requestQueue.getStatus();

  res.json({
    cache: stats,
    queue: queueStatus,
    hitRate:
      stats.totalRequests > 0 ? ((stats.hits / stats.totalRequests) * 100).toFixed(2) + '%' : '0%',
  });
};

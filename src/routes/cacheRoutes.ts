import { Router } from 'express';
import { clearCacheController, getCacheStatusController } from '../controllers/cacheController';

const router = Router();

router.delete('/', clearCacheController);

router.get('/status', getCacheStatusController);

export default router;

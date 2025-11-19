import { Router } from 'express';
import {
  getAllUsersController,
  getUserByIdController,
  createUserController,
} from '../controllers/userController';

const router = Router();

router.get('/', getAllUsersController);

router.get('/:id', getUserByIdController);

router.post('/', createUserController);

export default router;

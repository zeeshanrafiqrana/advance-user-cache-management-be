import { Request, Response } from 'express';
import { LRUCache } from '../cache/LRUCache';
import { RequestQueue } from '../queue/RequestQueue';
import { User, getUserById, getAllUsers, createUser, findUserByEmail } from '../helper';

let userCache: LRUCache<number, User>;
let requestQueue: RequestQueue;

export const initializeUserController = (
    cache: LRUCache<number, User>,
    queue: RequestQueue
): void => {
    userCache = cache;
    requestQueue = queue;
};

export const getAllUsersController = async (_req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = -1;
        const cachedUsers = userCache.get(cacheKey);

        if (cachedUsers) {
            res.json({
                data: cachedUsers,
                count: Array.isArray(cachedUsers) ? cachedUsers.length : 0,
                source: 'cache',
            });
            return;
        }

        const users = await requestQueue.enqueue('all-users', async () => {
            const fetchedUsers = await getAllUsers();

            userCache.set(cacheKey, fetchedUsers as unknown as User);
            return fetchedUsers;
        });

        res.json({
            data: users,
            count: users.length,
            source: 'database',
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while fetching users',
        });
    }
};

export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'User ID must be a valid number',
        });
        return;
    }

    try {
        const cachedUser = userCache.get(userId);
        if (cachedUser) {
            res.json({
                data: cachedUser,
                source: 'cache',
            });
            return;
        }

        const user = await requestQueue.enqueue(`user-${userId}`, async () => {
            const fetchedUser = await getUserById(userId);

            if (!fetchedUser) {
                return null;
            }

            userCache.set(userId, fetchedUser);
            return fetchedUser;
        });

        if (!user) {
            res.status(404).json({
                error: 'Not Found',
                message: `User with ID ${userId} does not exist`,
            });
            return;
        }

        res.json({
            data: user,
            source: 'database',
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while fetching the user',
        });
    }
};

export const createUserController = async (req: Request, res: Response): Promise<void> => {
    const { name, email } = req.body;

    if (!name || !email) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Name and email are required',
        });
        return;
    }

    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (trimmedName?.length < 2) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Name must be at least 2 characters long',
        });
        return;
    }

    if (trimmedName?.length > 100) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Name must not exceed 100 characters',
        });
        return;
    }

    if (typeof email !== 'string') {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Email must be a string',
        });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid email format',
        });
        return;
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            res.status(409).json({
                error: 'Conflict',
                message: 'User with same email already exists',
            });
            return;
        }
        const newUser = await createUser(trimmedName, email);

        userCache.set(newUser.id, newUser);

        res.status(201).json({
            data: newUser,
            message: 'User created successfully',
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while creating the user',
        });
    }
};

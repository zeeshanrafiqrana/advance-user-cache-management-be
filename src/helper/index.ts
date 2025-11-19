export interface User {
  id: number;
  name: string;
  email: string;
}

export const mockUsers: Record<number, User> = {
  1: { id: 1, name: 'John Doe', email: 'john@example.com' },
  2: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  3: { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
};

export const simulateDatabaseDelay = async (ms: number = 200): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getAllUsers = async (): Promise<User[]> => {
  await simulateDatabaseDelay(200);
  return Object.values(mockUsers);
};

export const getUserById = async (id: number): Promise<User | null> => {
  await simulateDatabaseDelay(200);
  return mockUsers[id] || null;
};

export const createUser = async (name: string, email: string): Promise<User> => {
  await simulateDatabaseDelay(200);

  const ids = Object.keys(mockUsers).map(Number);
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const newUser: User = {
    id: newId,
    name,
    email,
  };

  mockUsers[newId] = newUser;
  return newUser;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  await simulateDatabaseDelay(200);
  const user = Object.values(mockUsers).find((u) => u.email.toLowerCase() === email.toLowerCase());
  return user || null;
};

export const userExists = (id: number): boolean => {
  return id in mockUsers;
};

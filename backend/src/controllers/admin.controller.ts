import { Request, Response } from 'express';
import prisma from '../prisma';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role, status },
    });
    res.json({ message: 'User updated', user: { id: updated.id, email: updated.email, role: updated.role, status: updated.status } });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

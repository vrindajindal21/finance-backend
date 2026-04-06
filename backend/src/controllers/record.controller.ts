import { Request, Response } from 'express';
import prisma from '../prisma';

export const createRecord = async (req: Request, res: Response) => {
  const { amount, type, category, date, notes } = req.body;

  try {
    const record = await prisma.financialRecord.create({
      data: {
        amount,
        type,
        category,
        date: date ? new Date(date) : undefined,
        notes,
      },
    });

    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create record', error: error.message });
  }
};

export const getRecords = async (req: Request, res: Response) => {
  const { type, category, startDate, endDate, q, page = '1', limit = '10' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const where: any = {
      isDeleted: false, // Default: don't show deleted unless Admin explicitly asks (optional)
      type: type ? (type as string).toUpperCase() : undefined,
      category: category ? (category as string) : undefined,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    // Global Search
    if (q) {
      where.OR = [
        { category: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      prisma.financialRecord.count({ where })
    ]);

    res.json({
      records,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch records', error: error.message });
  }
};

export const updateRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const existing = await prisma.financialRecord.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) return res.status(404).json({ message: 'Record not found' });

    const updated = await prisma.financialRecord.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update record', error: error.message });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Soft delete
    await prisma.financialRecord.update({ 
      where: { id },
      data: { isDeleted: true }
    });
    res.json({ message: 'Record soft-deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete record', error: error.message });
  }
};

export const restoreRecord = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.financialRecord.update({
      where: { id },
      data: { isDeleted: false }
    });
    res.json({ message: 'Record restored successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to restore record', error: error.message });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const records = await prisma.financialRecord.findMany({
      where: { isDeleted: false }
    });

    const stats = records.reduce(
      (acc: { income: number; expenses: number; categoryWise: Record<string, number> }, curr: any) => {
        if (curr.type === 'INCOME') acc.income += curr.amount;
        else acc.expenses += curr.amount;

        if (!acc.categoryWise[curr.category]) acc.categoryWise[curr.category] = 0;
        acc.categoryWise[curr.category] += curr.amount;

        return acc;
      },
      { income: 0, expenses: 0, categoryWise: {} }
    );

    const recentActivity = await prisma.financialRecord.findMany({
      take: 5,
      orderBy: { date: 'desc' },
    });

    res.json({
      totalIncome: stats.income,
      totalExpenses: stats.expenses,
      netBalance: stats.income - stats.expenses,
      categoryWiseTotals: stats.categoryWise,
      recentActivity,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch summary', error: error.message });
  }
};

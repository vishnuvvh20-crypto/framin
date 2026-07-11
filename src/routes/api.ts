import { Router, Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { validate } from '../middleware/validation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation Schemas
const incomeSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    source: z.string().min(1, 'Source is required').max(255),
    date: z.string().optional(),
    description: z.string().optional(),
  }),
});

const expenseSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required').max(255),
    date: z.string().optional(),
    description: z.string().optional(),
  }),
});

// GET /api/v1/income
router.get(
  '/income',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [rows] = await pool.query('SELECT * FROM income ORDER BY date DESC');
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/v1/income
router.post(
  '/income',
  authenticateToken,
  validate(incomeSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, source, date, description } = req.body;
      const formattedDate = date ? new Date(date) : new Date();

      const [result]: any = await pool.query(
        'INSERT INTO income (amount, source, date, description) VALUES (?, ?, ?, ?)',
        [amount, source, formattedDate, description]
      );

      res.json({ id: result.insertId, amount, source, date: formattedDate.toISOString(), description });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/v1/expense
router.get(
  '/expense',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [rows] = await pool.query('SELECT * FROM expense ORDER BY date DESC');
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/v1/expense
router.post(
  '/expense',
  authenticateToken,
  validate(expenseSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, category, date, description } = req.body;
      const formattedDate = date ? new Date(date) : new Date();

      const [result]: any = await pool.query(
        'INSERT INTO expense (amount, category, date, description) VALUES (?, ?, ?, ?)',
        [amount, category, formattedDate, description]
      );

      res.json({ id: result.insertId, amount, category, date: formattedDate.toISOString(), description });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

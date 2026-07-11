import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Bypass for guest mode during initial testing / demo offline operations
  if (token === 'guest-bypass-token') {
    req.user = { id: 'guest', role: 'owner' };
    return next();
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'super_secret_jwt_sign_key_for_farmin_enterprise',
    (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = decoded;
      next();
    }
  );
};

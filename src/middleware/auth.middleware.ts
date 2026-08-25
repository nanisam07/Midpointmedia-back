import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    role: string;
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      phone: string;
      role: string;
    };

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }

    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
}

export function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      phone: string;
      role: string;
    };

    if (decoded.userId) {
      req.user = {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
}
export function authorizeAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
}
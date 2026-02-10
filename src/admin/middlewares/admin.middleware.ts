import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import config from '../../config/config';
import AppDataSource from '../../data-source';
import { Admin, AdminRole } from '../models/Admin';

export interface AdminRequest extends Request {
    admin?: {
        id: string;
        email: string;
        role: AdminRole;
    };
}

/**
 * Middleware to authenticate admin using JWT token
 */
export const authenticateAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT.SECRET) as { id: string; email: string; role: AdminRole; isAdmin: boolean };

        // Verify this is an admin token
        if (!decoded.isAdmin) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'Access denied. Admin token required.' });
        }

        // Verify admin exists and is active
        const adminRepository = AppDataSource.getRepository(Admin);
        const admin = await adminRepository.findOne({ where: { id: decoded.id } });

        if (!admin) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Admin not found' });
        }

        if (!admin.isActive) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'Account is deactivated' });
        }

        if (admin.lockedAt) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'Account is locked' });
        }

        req.admin = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid token' });
    }
};

/**
 * Middleware to require master_admin role
 */
export const requireMasterAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication required' });
    }

    if (req.admin.role !== AdminRole.MASTER_ADMIN) {
        return res.status(StatusCodes.FORBIDDEN).json({ message: 'Master admin access required' });
    }

    next();
};

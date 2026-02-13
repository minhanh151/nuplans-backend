import { Response } from 'express';
import { UserAtRiskService } from '@/services/UserAtRiskService';
import { AdminRequest } from '../middlewares/admin.middleware';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

const userAtRiskService = UserAtRiskService.getInstance();

export class AdminAtRiskController {
    /**
     * GET /api/admin/at-risks
     * Get list of at-risk users.
     * Master admin: all users. Regular admin: assigned users only.
     * Query params: status, riskLevel, page, limit
     */
    static async getAtRiskUsers(req: AdminRequest, res: Response) {
        try {
            const { status, riskLevel, page, limit } = req.query;

            const result = await userAtRiskService.getAtRiskUsers(
                req.admin!.id,
                req.admin!.role,
                {
                    status: status as string,
                    riskLevel: riskLevel as string,
                    page: page ? parseInt(page as string, 10) : undefined,
                    limit: limit ? parseInt(limit as string, 10) : undefined,
                }
            );

            sendSuccess(res, result, 'At-risk users retrieved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'BAD_REQUEST', StatusCodes.BAD_REQUEST);
        }
    }
}

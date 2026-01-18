import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError, sendSuccess } from '../utils/apiResponse';
import logger from '../utils/logger';

export class BaseController {
  protected service: any;

  constructor(service: any) {
    this.service = service;
  }

  protected handleError(res: Response, error: Error, message: string = 'An error occurred'): void {
    logger.error(`${this.constructor.name} error:`, error);
    sendError(res, message, 'INTERNAL_SERVER_ERROR', StatusCodes.INTERNAL_SERVER_ERROR, error);
  }

  protected handleBadRequest(res: Response, message: string = 'Resource not found', code: string = 'BAD_REQUEST'): void {
    sendError(res, message, code, StatusCodes.BAD_REQUEST);
  }

  protected handleSuccess<T>(res: Response, data: T, message: string = 'Success'): void {
    sendSuccess(res, data, message);
  }

  // Example of a generic CRUD method
  protected async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.service.getAll(req.query);
      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(res, error as Error, 'Failed to fetch records');
    }
  }

  // Add other common CRUD methods here as needed
}

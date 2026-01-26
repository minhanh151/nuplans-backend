import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getTraceId } from './context';
import logger from './logger';

interface IApiResponse<T> {
  success: boolean;
  message: string;
  code?: string;
  data?: T;
  error?: any;
}

/**
 * Sends a standardized success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = StatusCodes.OK
): void => {
  const response: IApiResponse<T> = {
    success: true,
    code: 'SUCCESS',
    message,
    data
  };

  res.status(statusCode).json(response);
};

/**
 * Sends a standardized error response
 */
export const sendError = (
  res: Response,
  message: string = 'An error occurred',
  code: string = 'INTERNAL_SERVER_ERROR',
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  error?: any
): void => {
  const response: IApiResponse<null> = {
    success: false,
    message,
    code,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  };

  res.status(statusCode).json(response);
};

/**
 * Sends a standardized validation error response
 */
export const sendValidationError = (
  res: Response,
  message: string = 'Validation failed',
  errors: any
): void => {
  sendError(res, message, 'VALIDATION_ERROR', StatusCodes.UNPROCESSABLE_ENTITY, errors);
};

/**
 * Sends a standardized not found response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): void => {
  sendError(res, message, 'NOT_FOUND', StatusCodes.NOT_FOUND);
};

/**
 * Sends a standardized unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): void => {
  sendError(res, message, 'UNAUTHORIZED', StatusCodes.UNAUTHORIZED);
};

/**
 * Sends a standardized forbidden response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): void => {
  sendError(res, message, 'FORBIDDEN', StatusCodes.FORBIDDEN);
};

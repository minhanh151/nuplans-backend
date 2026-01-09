import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface IApiResponse<T> {
  success: boolean;
  message: string;
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
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  error?: any
): void => {
  const response: IApiResponse<null> = {
    success: false,
    message,
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
  sendError(res, message, StatusCodes.UNPROCESSABLE_ENTITY, errors);
};

/**
 * Sends a standardized not found response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): void => {
  sendError(res, message, StatusCodes.NOT_FOUND);
};

/**
 * Sends a standardized unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): void => {
  sendError(res, message, StatusCodes.UNAUTHORIZED);
};

/**
 * Sends a standardized forbidden response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): void => {
  sendError(res, message, StatusCodes.FORBIDDEN);
};

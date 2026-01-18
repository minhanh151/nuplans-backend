import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to log API requests and responses
 */
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, url, body, query } = req;

    // Mask sensitive information in body if necessary
    const maskedBody = { ...body };
    const sensitiveFields = ['password', 'token', 'refreshToken', 'secret'];
    sensitiveFields.forEach(field => {
        if (maskedBody[field]) {
            maskedBody[field] = '********';
        }
    });

    // Log request
    logger.info(`Incoming Request: ${method} ${url}`, {
        query,
        body: maskedBody,
    });

    // Capture the original send to log response body
    const originalSend = res.send;
    res.send = function (content) {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        // Try to parse content if it's a string, to log it as an object
        let responseBody = content;
        try {
            if (typeof content === 'string') {
                responseBody = JSON.parse(content);
            }
        } catch (e) {
            // Not JSON, keep as is
        }

        // Log response
        logger.info(`Outgoing Response: ${method} ${url} - ${statusCode} (${duration}ms)`, {
            statusCode,
            duration: `${duration}ms`,
            // Be careful with large response bodies, could truncate here if needed
            responseBody: typeof responseBody === 'object' ? responseBody : 'Non-JSON response'
        });

        return originalSend.apply(res, arguments as any);
    };

    next();
};

export default loggingMiddleware;

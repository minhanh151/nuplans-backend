import winston from 'winston';
import config from '../config/config';
import { getTraceId } from './context';

const { combine, timestamp, printf, colorize, align, uncolorize, json } = winston.format;

// Define log format for console (with colors)
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  printf(({ level, message, timestamp, ...meta }) => {
    const traceId = getTraceId();
    const traceString = traceId ? ` [${traceId}]` : '';
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 4)}` : '';
    return `${timestamp}${traceString} [${level}]: ${message}${metaString}`;
  })
);

// Define log format for files (JSON format for ELK)
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format((info) => {
    const traceId = getTraceId();
    if (traceId) {
      info.traceId = traceId;
    }
    return info;
  })(),
  json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  defaultMeta: { service: 'nuplans-be', env: config.NODE_ENV },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat
    })
  ]
});

// If we're not in production, also log to the console
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

export default logger;

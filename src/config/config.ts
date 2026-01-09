import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define the interface for our configuration
export interface IConfig {
  // Server configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // Database configuration
  DB: {
    HOST: string;
    PORT: number;
    USERNAME: string;
    PASSWORD: string;
    NAME: string;
    SYNC: boolean;
    LOGGING: boolean;
  };

  // JWT configuration
  JWT: {
    SECRET: string;
    EXPIRES_IN: string;
  };

  // CORS configuration
  CORS: {
    ORIGIN: string | string[];
  };

  // Logging
  LOG_LEVEL: string;

  // Email Config
  EMAIL: {
    HOST: string;
    PORT: number;
    USER: string;
    PASS: string;
    FROM: string;
  };

  // App Config
  APP_URL: string;
}

// Parse environment variables and create configuration object
const config: IConfig = {
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '5432', 10),
    USERNAME: process.env.DB_USERNAME || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || 'postgres',
    NAME: process.env.DB_NAME || 'nuplans_db',
    SYNC: process.env.DB_SYNC === 'true',
    LOGGING: process.env.DB_LOGGING === 'true'
  },

  JWT: {
    SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
  },

  CORS: {
    ORIGIN: process.env.CORS_ORIGIN ?
      (process.env.CORS_ORIGIN.includes(',') ?
        process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) :
        process.env.CORS_ORIGIN) :
      '*'
  },

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  EMAIL: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.SMTP_FROM || '"Nuplans Support" <no-reply@nuplans.com>'
  },

  APP_URL: process.env.APP_URL || 'http://localhost:3000'
};

export default config;

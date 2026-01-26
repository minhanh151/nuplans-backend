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
    REFRESH_SECRET: string;
    REFRESH_EXPIRES_IN: string;
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

  // AI Config
  AI: {
    GEMINI_API_KEY: string;
    GEMINI_MODEL: string;
    OPENAI_API_KEY: string;
    OPENAI_MODEL: string;
    OPENAI_BASE_URL: string;
    MILESTONE_ACTION_OPENAI_API_KEY: string;
    MILESTONE_ACTION_OPENAI_API_MODEL: string;
    MILESTONE_ACTION_OPENAI_API_BASE_URL: string;
    PLANNING_OPENAI_API_KEY: string;
    PLANNING_OPENAI_API_MODEL: string;
    PLANNING_OPENAI_API_BASE_URL: string;
    PARSE_CV_API_KEY: string;
    PARSE_CV_API_MODEL: string;
    PARSE_CV_API_BASE_URL: string;
  };

  // Storage Config (Supabase)
  STORAGE: {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    CV_BUCKET: string;
  };
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
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_SECRET: process.env.REFRESH_SECRET || 'your_refresh_token_secret_here',
    REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN || '7d'
  },

  CORS: {
    ORIGIN: process.env.CORS_ORIGIN ?
      (process.env.CORS_ORIGIN.includes(',') ?
        process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) :
        process.env.CORS_ORIGIN) :
      ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081']
  },

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  EMAIL: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.SMTP_FROM || '"Nuplans Support" <no-reply@nuplans.com>'
  },

  APP_URL: process.env.APP_URL || 'http://localhost:3000',

  AI: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    MILESTONE_ACTION_OPENAI_API_KEY: process.env.MILESTONE_ACTION_OPENAI_API_KEY || '',
    MILESTONE_ACTION_OPENAI_API_MODEL: process.env.MILESTONE_ACTION_OPENAI_API_MODEL || '',
    MILESTONE_ACTION_OPENAI_API_BASE_URL: process.env.MILESTONE_ACTION_OPENAI_API_BASE_URL || '',
    PLANNING_OPENAI_API_KEY: process.env.PLANNING_OPENAI_API_KEY || '',
    PLANNING_OPENAI_API_MODEL: process.env.PLANNING_OPENAI_API_MODEL || '',
    PLANNING_OPENAI_API_BASE_URL: process.env.PLANNING_OPENAI_API_BASE_URL || '',
    PARSE_CV_API_KEY: process.env.PARSE_CV_API_KEY || '',
    PARSE_CV_API_MODEL: process.env.PARSE_CV_API_MODEL || '',
    PARSE_CV_API_BASE_URL: process.env.PARSE_CV_API_BASE_URL || ''
  },

  STORAGE: {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '',
    CV_BUCKET: process.env.CV_BUCKET || 'cvs'
  }
};

export default config;

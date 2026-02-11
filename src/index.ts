import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { DataSource } from 'typeorm';
import AppDataSource from './data-source';
import config from './config/config';
import logger from './utils/logger';
import loggingMiddleware from './middlewares/loggingMiddleware';
import { CronJobRunner } from './crons/CronJobRunner';
import { sendError } from './utils/apiResponse';
import { StatusCodes } from 'http-status-codes';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import adminRoutes from './routes/admin.routes';

class App {
  public app: Application;
  public port: number;
  private dataSource!: DataSource;

  constructor() {
    this.app = express();
    this.port = config.PORT;
    this.initializeDatabase()
      .then(() => {
        this.initializeBeforeMiddlewares();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        CronJobRunner.getInstance().init();
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
      });
  }


  private initializeBeforeMiddlewares(): void {
    // Parse JSON and URL-encoded bodies first so we can log them
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging (detailed)
    this.app.use(loggingMiddleware);
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // Enable CORS
    this.app.use(cors({
      origin: config.CORS.ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
    }));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(StatusCodes.OK).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    });

    // API routes will be mounted here
    // API routes will be mounted here
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api', apiRoutes);

    // Admin routes
    this.app.use('/api/admin', adminRoutes);

    // Handle 404
    this.app.use((req: Request, res: Response) => {
      sendError(res, 'Not Found', 'NOT_FOUND', StatusCodes.NOT_FOUND);
    });
  }

  private initializeErrorHandling(): void {
    // Error handling middleware
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger.error(`Error: ${err.message}`, { error: err });

      const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
      const message = err.message || 'Internal Server Error';

      sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err : undefined);
    });
  }


  private async initializeDatabase(): Promise<void> {
    try {
      this.dataSource = AppDataSource;
      await this.dataSource.initialize();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection error:', error);
      process.exit(1);
    }
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info(`Server is running on port ${this.port} in ${config.NODE_ENV} mode`);
    });
  }
}

// Create server instance and start the server
const server = new App();
server.listen();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

export default server.app;

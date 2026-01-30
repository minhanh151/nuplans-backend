# Nuplans Backend API

Backend service for Nuplans - Personal planning and career development system with AI integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

## 🎯 Overview

Nuplans Backend is a RESTful API service built with Node.js, Express, and TypeORM. The system provides personal planning management, career development features, and AI integration to support users.

## ✨ Key Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Email verification
- Password reset
- Refresh token mechanism

### 👤 User Profile & Onboarding
- Personal information management
- CV upload and parsing (PDF, DOCX)
- CV storage on Supabase Storage
- Profile completion tracking

### 🎯 Planning & Goals
- **Projects**: Personal project management
- **Milestones**: Important project milestones
- **Milestone Steps**: Detailed steps to complete milestones
- **Weekly Plans**: Weekly planning
- **Daily Actions**: Daily action items

### 🤖 AI Integration
- Automatic CV analysis with AI
- Career development plan generation
- Daily actions and milestones suggestions
- Chat assistant for planning

### 💬 Chat System
- Chat threads for each context (project, milestone, weekly plan)
- Chat history management
- Archive/Unarchive threads
- AI-powered responses

### 📊 Credit Assessment
- User capability assessment
- Credit score calculation
- Progress tracking

### 🔄 Cron Jobs
- Automatic weekly plan generation
- Scheduled events processing
- Background tasks

### 📝 Logging & Monitoring
- Request/Response logging with Winston
- Trace ID for each request
- Structured logging with context

## 🛠 Technology Stack

### Core
- **Node.js** (>= 18.0.0)
- **TypeScript** - Type safety
- **Express** - Web framework
- **TypeORM** - ORM for PostgreSQL

### Database
- **PostgreSQL** - Primary database
- **Supabase** - Storage for files

### Authentication & Security
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### AI Services
- **Google Gemini AI** - AI generation
- **OpenAI/Groq** - Alternative AI providers

### File Processing
- **Multer** - File upload handling
- **pdf-parse** - PDF parsing
- **mammoth** - DOCX parsing

### Utilities
- **Winston** - Logging
- **node-cron** - Scheduled tasks
- **Nodemailer** - Email sending
- **Axios** - HTTP client

## 📦 System Requirements

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm or yarn

## 🚀 Installation

### 1. Clone repository

```bash
git clone <repository-url>
cd nuplans-be
```

### 2. Install dependencies

```bash
npm install
```

### 3. Database setup

#### Option 1: Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

#### Option 2: Manual PostgreSQL installation

Create a new database:
```sql
CREATE DATABASE nuplans_db;
```

### 4. Environment configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update environment variables in `.env` file (see [Configuration](#configuration) section)

## ⚙️ Configuration

### Database Configuration

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nuplans_db
DB_SYNC=true          # Auto sync schema (development only)
DB_LOGGING=false
```

### JWT Configuration

```env
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=24h
```

### Email Configuration (SMTP)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Nuplans Support" <no-reply@nuplans.com>
```

### AI Configuration

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# OpenAI/Groq
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo
OPENAI_BASE_URL=https://api.groq.com/openai/v1

# Specific AI endpoints
MILESTONE_ACTION_OPENAI_API_KEY=your_key
MILESTONE_ACTION_OPENAI_API_MODEL=your_model
MILESTONE_ACTION_OPENAI_API_BASE_URL=your_base_url

PLANNING_OPENAI_API_KEY=your_key
PLANNING_OPENAI_API_MODEL=your_model
PLANNING_OPENAI_API_BASE_URL=your_base_url

PARSE_CV_API_KEY=your_key
PARSE_CV_API_MODEL=your_model
PARSE_CV_API_BASE_URL=your_base_url
```

### Storage Configuration (Supabase)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CV_BUCKET=cvs
```

### CORS Configuration

```env
CORS_ORIGIN=http://localhost:8080
```

## 🏃 Running the Application

### Development mode

```bash
npm run dev
```

Server will run at `http://localhost:3000` with hot-reload.

### Production mode

```bash
# Build
npm run build

# Start
npm start
```

### Health Check

Check if server is running:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2026-01-26T15:11:35.124Z"
}
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require JWT token in header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

All responses follow a standard format:

**Success Response:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error message",
  "error": { ... }  // Only in development mode
}
```

### Headers

All responses include `X-Trace-Id` header for tracking:

```
X-Trace-Id: 75764b88-b3e8-454f-89ab-8139023fad1f
```

### API Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new account |
| POST | `/login` | User login |
| POST | `/verify-email` | Verify email |
| POST | `/resend-verification` | Resend verification email |
| POST | `/forgot-password` | Forgot password |
| POST | `/reset-password` | Reset password |
| POST | `/refresh-token` | Refresh JWT token |

#### CV Management (`/api/cv`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload CV file |
| POST | `/parse` | Parse CV with AI |
| POST | `/save-profile` | Save profile from CV |

#### Onboarding (`/api/onboarding`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get profile information |
| POST | `/save` | Save onboarding information |

#### Daily Actions (`/api/daily-actions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get daily actions list |
| PATCH | `/:id/complete` | Mark as completed |
| PATCH | `/:id/uncomplete` | Unmark as completed |

**Query Parameters:**
- `limit`: Number of records (default: 10)
- `createdDate`: Filter by date (YYYY-MM-DD)

#### Milestones (`/api/milestones`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get milestones list |
| GET | `/:id` | Get milestone details |
| PATCH | `/steps/:stepId/complete` | Mark step as completed |
| PATCH | `/steps/:stepId/uncomplete` | Unmark step as completed |

**Query Parameters:**
- `limit`: Number of records (default: 10)
- `maxDeadline`: Filter by deadline (YYYY-MM-DD)
- `status`: Filter by status

#### Chat (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/threads` | Get chat threads list |
| GET | `/history/:threadId` | Get chat history |
| POST | `/message` | Send message |
| POST | `/archive` | Archive thread |
| POST | `/unarchive` | Unarchive thread |

#### Credit Assessment (`/api/credit`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/latest` | Get latest credit assessment |
| POST | `/calculate` | Calculate credit score |

#### Dashboard (`/api/dashboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Generate dashboard data |
| POST | `/generate-weekly` | Generate weekly plan |

#### Identity Verification (`/api/id`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verify` | Verify identity |

## 📁 Project Structure

```
nuplans-be/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── crons/           # Cron jobs
│   ├── interfaces/      # TypeScript interfaces
│   ├── middlewares/     # Express middlewares
│   ├── models/          # TypeORM entities
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── data-source.ts   # TypeORM configuration
│   └── index.ts         # Application entry point
├── logs/                # Application logs
├── dist/                # Compiled JavaScript (production)
├── .env                 # Environment variables
├── .env.example         # Environment template
├── docker-compose.yml   # Docker configuration
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## 🔧 Scripts

```bash
# Development
npm run dev              # Run with hot-reload

# Production
npm run build           # Build TypeScript
npm start              # Run production build

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## 📝 Logging

Logs are saved in the `logs/` directory:
- `combined.log` - All logs
- Console output in development mode

Each log entry includes:
- `timestamp` - Time
- `level` - Log level (info, error, warn)
- `message` - Log content
- `traceId` - Request trace ID
- `service` - Service name

## 🔍 Debugging

### Trace ID

Each request has a unique trace ID for tracking:

```bash
# Find logs by trace ID
grep "75764b88-b3e8-454f-89ab-8139023fad1f" logs/combined.log
```

### Database Queries

Enable TypeORM logging in `.env`:

```env
DB_LOGGING=true
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

## 📄 License

Private project - All rights reserved

## 👥 Contact

Project Link: [https://github.com/yourusername/nuplans-be](https://github.com/yourusername/nuplans-be)

---

**Made with ❤️ by Nuplans Team**

# Nuplans Backend API

Backend service cho ứng dụng Nuplans - Hệ thống quản lý kế hoạch cá nhân và phát triển sự nghiệp với AI.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [API Documentation](#api-documentation)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)

## 🎯 Tổng quan

Nuplans Backend là một RESTful API service được xây dựng với Node.js, Express, và TypeORM. Hệ thống cung cấp các tính năng quản lý kế hoạch cá nhân, phát triển sự nghiệp, và tích hợp AI để hỗ trợ người dùng.

## ✨ Tính năng chính

### 🔐 Authentication & Authorization
- Đăng ký và đăng nhập người dùng
- JWT-based authentication
- Email verification
- Password reset
- Refresh token mechanism

### 👤 User Profile & Onboarding
- Quản lý thông tin cá nhân
- CV upload và parsing (PDF, DOCX)
- Lưu trữ CV trên Supabase Storage
- Profile completion tracking

### 🎯 Planning & Goals
- **Projects**: Quản lý các dự án cá nhân
- **Milestones**: Các mốc quan trọng trong dự án
- **Milestone Steps**: Các bước chi tiết để hoàn thành milestone
- **Weekly Plans**: Kế hoạch hàng tuần
- **Daily Actions**: Các hành động cần làm hàng ngày

### 🤖 AI Integration
- Phân tích CV tự động với AI
- Tạo kế hoạch phát triển sự nghiệp
- Gợi ý daily actions và milestones
- Chat assistant cho planning

### 💬 Chat System
- Chat threads cho từng context (project, milestone, weekly plan)
- Chat history management
- Archive/Unarchive threads
- AI-powered responses

### 📊 Credit Assessment
- Đánh giá năng lực người dùng
- Tính toán credit score
- Tracking progress

### 🔄 Cron Jobs
- Tự động tạo weekly plans
- Scheduled events processing
- Background tasks

### 📝 Logging & Monitoring
- Request/Response logging với Winston
- Trace ID cho mỗi request
- Structured logging với context

## 🛠 Công nghệ sử dụng

### Core
- **Node.js** (>= 18.0.0)
- **TypeScript** - Type safety
- **Express** - Web framework
- **TypeORM** - ORM cho PostgreSQL

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

## 📦 Yêu cầu hệ thống

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm hoặc yarn

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd nuplans-be
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình database

#### Option 1: Sử dụng Docker Compose (Recommended)

```bash
docker-compose up -d
```

#### Option 2: Cài đặt PostgreSQL thủ công

Tạo database mới:
```sql
CREATE DATABASE nuplans_db;
```

### 4. Cấu hình môi trường

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong file `.env` (xem phần [Cấu hình](#cấu-hình))

## ⚙️ Cấu hình

### Database Configuration

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nuplans_db
DB_SYNC=true          # Auto sync schema (chỉ dùng trong development)
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

## 🏃 Chạy ứng dụng

### Development mode

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000` với hot-reload.

### Production mode

```bash
# Build
npm run build

# Start
npm start
```

### Health Check

Kiểm tra server đang chạy:

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

Hầu hết các endpoints yêu cầu JWT token trong header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

Tất cả responses đều có format chuẩn:

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
  "error": { ... }  // Chỉ có trong development mode
}
```

### Headers

Mọi response đều có `X-Trace-Id` header để tracking:

```
X-Trace-Id: 75764b88-b3e8-454f-89ab-8139023fad1f
```

### API Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Đăng ký tài khoản mới |
| POST | `/login` | Đăng nhập |
| POST | `/verify-email` | Xác thực email |
| POST | `/resend-verification` | Gửi lại email xác thực |
| POST | `/forgot-password` | Quên mật khẩu |
| POST | `/reset-password` | Reset mật khẩu |
| POST | `/refresh-token` | Refresh JWT token |

#### CV Management (`/api/cv`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload CV file |
| POST | `/parse` | Parse CV với AI |
| POST | `/save-profile` | Lưu thông tin từ CV |

#### Onboarding (`/api/onboarding`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Lấy thông tin profile |
| POST | `/save` | Lưu thông tin onboarding |

#### Daily Actions (`/api/daily-actions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Lấy danh sách daily actions |
| PATCH | `/:id/complete` | Đánh dấu hoàn thành |
| PATCH | `/:id/uncomplete` | Bỏ đánh dấu hoàn thành |

**Query Parameters:**
- `limit`: Số lượng records (default: 10)
- `createdDate`: Filter theo ngày (YYYY-MM-DD)

#### Milestones (`/api/milestones`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Lấy danh sách milestones |
| GET | `/:id` | Lấy chi tiết milestone |
| PATCH | `/steps/:stepId/complete` | Đánh dấu step hoàn thành |
| PATCH | `/steps/:stepId/uncomplete` | Bỏ đánh dấu step hoàn thành |

**Query Parameters:**
- `limit`: Số lượng records (default: 10)
- `maxDeadline`: Filter theo deadline (YYYY-MM-DD)
- `status`: Filter theo status

#### Chat (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/threads` | Lấy danh sách chat threads |
| GET | `/history/:threadId` | Lấy lịch sử chat |
| POST | `/message` | Gửi message |
| POST | `/archive` | Archive thread |
| POST | `/unarchive` | Unarchive thread |

#### Credit Assessment (`/api/credit`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/latest` | Lấy credit assessment mới nhất |
| POST | `/calculate` | Tính toán credit score |

#### Dashboard (`/api/dashboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Generate dashboard data |
| POST | `/generate-weekly` | Generate weekly plan |

#### Identity Verification (`/api/id`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verify` | Xác thực danh tính |

## 📁 Cấu trúc thư mục

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
npm run dev              # Chạy với hot-reload

# Production
npm run build           # Build TypeScript
npm start              # Chạy production build

# Code Quality
npm run lint           # Chạy ESLint
npm run format         # Format code với Prettier
```

## 📝 Logging

Logs được lưu trong thư mục `logs/`:
- `combined.log` - Tất cả logs
- Console output trong development mode

Mỗi log entry bao gồm:
- `timestamp` - Thời gian
- `level` - Log level (info, error, warn)
- `message` - Nội dung log
- `traceId` - Trace ID của request
- `service` - Service name

## 🔍 Debugging

### Trace ID

Mỗi request có một unique trace ID để tracking:

```bash
# Tìm logs theo trace ID
grep "75764b88-b3e8-454f-89ab-8139023fad1f" logs/combined.log
```

### Database Queries

Bật logging cho TypeORM trong `.env`:

```env
DB_LOGGING=true
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Private project - All rights reserved

## 👥 Contact

Project Link: 

---

**Made with ❤️ by Nuplans Team**

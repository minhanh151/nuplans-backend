# ----------------------------
# STAGE 1: BUILDER
# ----------------------------
FROM node:22-alpine AS builder

# Cài đặt dependencies cần thiết cho pdf-parse và canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

# Copy lock file để đảm bảo tính nhất quán version
COPY package*.json ./

# Dùng 'npm ci' thay vì 'npm install' để build nhanh hơn và đúng lock file 100%
RUN npm ci

COPY . .

RUN npm run build

# ----------------------------
# STAGE 2: PRODUCTION
# ----------------------------
FROM node:22-alpine

# Cài đặt runtime dependencies cho pdf-parse
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

# Copy package.json để cài prod dependencies
COPY package*.json ./

# 1. Dùng 'npm ci'
# 2. --omit=dev: Chỉ cài dependencies, bỏ qua devDependencies (thay thế --only=production)
# 3. npm cache clean: Xóa cache để giảm dung lượng image
RUN npm ci --omit=dev && npm cache clean --force

# Copy code đã build từ builder
COPY --from=builder /app/dist ./dist

# [QUAN TRỌNG] Copy các file config runtime nếu cần (ví dụ ormconfig.json, .env.example)
# COPY ormconfig.json ./ 

# [BẢO MẬT] Đổi quyền sở hữu thư mục app cho user 'node'
RUN chown -R node:node /app

# [BẢO MẬT] Chuyển sang user node (không chạy root)
USER node

EXPOSE 3000

# [ỔN ĐỊNH] Chạy trực tiếp node để nhận tín hiệu OS (SIGTERM)
# Đảm bảo đường dẫn dist/index.js đúng với output của lệnh build
CMD ["node", "dist/index.js"]
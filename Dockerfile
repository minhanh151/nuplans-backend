# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
# We might need some other files if they are not built into dist (like OrmConfig if it's used at runtime by TypeORM CLI, but in code we import it)
# For now, copying everything needed.

EXPOSE 3000

CMD ["npm", "start"]

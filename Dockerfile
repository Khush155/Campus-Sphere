# Stage 1: Build React Client Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Setup Node Server Backend (MongoDB)
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY --from=client-builder /app/client/dist /app/server/public

EXPOSE 80 5000
ENV NODE_ENV=production

CMD ["npm", "start"]

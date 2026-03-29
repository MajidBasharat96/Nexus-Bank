FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build 2>/dev/null || true

FROM node:20-alpine AS runtime
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY package*.json ./
COPY tsconfig.json ./

RUN mkdir -p uploads logs

ENV NODE_ENV=production
EXPOSE 3000

# Install ts-node for fallback
RUN npm install -g ts-node typescript

CMD ["node", "-e", "require('ts-node').register(); require('./src/main.ts');"]

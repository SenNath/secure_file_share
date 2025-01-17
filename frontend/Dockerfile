# Build stage
FROM node:18-alpine as builder
WORKDIR /

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy certificates from host
COPY ../backend/certificates/server.key /app/certificates/
COPY ../backend/certificates/server.crt /app/certificates/

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/certificates ./certificates

RUN npm install -g serve
EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000", "--ssl-cert", "./certificates/server.crt", "--ssl-key", "./certificates/server.key"] 
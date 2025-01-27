# Build stage
FROM node:18-alpine as builder
WORKDIR /

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Debug: Check if certificates exist
RUN echo "Checking certificate directory:" && \
    ls -la /certificates || echo "Certificates directory not found" && \
    echo "Current directory:" && \
    pwd && \
    ls -la

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /

COPY --from=builder /dist ./dist
COPY --from=builder /package*.json ./

RUN npm install -g serve
EXPOSE 3000

# Start serve with HTTPS
CMD ["serve", "-s", "dist", "-l", "3000", "--ssl-cert", "/certificates/server.crt", "--ssl-key", "/certificates/server.key"] 
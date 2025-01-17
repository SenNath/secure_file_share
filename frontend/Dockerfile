# Build stage
FROM node:18-alpine as builder
WORKDIR /

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /

COPY --from=builder /dist ./dist
COPY --from=builder /package*.json ./
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"] 
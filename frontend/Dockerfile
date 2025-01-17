FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Install serve to run the application
RUN npm install -g serve

# Start the app
CMD serve -s build -l 3000 
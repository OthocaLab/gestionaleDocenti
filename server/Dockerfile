FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose the port
EXPOSE 5000

# Add nodemon for development
RUN npm install -g nodemon

# Start the server with nodemon for hot reloading, ignoring uploads and node_modules
CMD ["nodemon", "--legacy-watch", "--ignore", "uploads/", "--ignore", "node_modules/", "--ignore", "*.log", "server.js"] 
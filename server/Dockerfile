FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the port
EXPOSE 5000

# Add nodemon for development
RUN npm install -g nodemon

# Start the server with nodemon for hot reloading
CMD ["nodemon", "--legacy-watch", "src/index.js"] 
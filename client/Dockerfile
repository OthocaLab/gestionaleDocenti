FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Expose the port
EXPOSE 3000

# Start production server
CMD ["npm", "run", "start"] 
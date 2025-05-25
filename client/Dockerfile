FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Pass environment variables for build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_API_DESTINATION
ARG NODE_ENV

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_API_DESTINATION=$NEXT_PUBLIC_API_DESTINATION
ENV NODE_ENV=$NODE_ENV

# Build the application for production
RUN npm run build

# Expose the port
EXPOSE 3000

# Start production server
CMD ["npm", "run", "start"] 
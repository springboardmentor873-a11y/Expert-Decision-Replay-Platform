# Stage 1: Build the React/Vite SPA application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with package lock verification
COPY package*.json ./
RUN npm ci

# Copy frontend source files
COPY . .

# Configurable API URL build argument (defaults to http://localhost:8000 for standard local browser access)
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build optimized production bundle
RUN npm run build

# Stage 2: Serve production build with lightweight Nginx
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration supporting SPA routing and API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check to ensure Nginx is responding
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

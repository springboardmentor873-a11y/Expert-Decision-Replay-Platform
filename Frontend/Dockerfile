# ============================================================
# Stage 1: build the Vite bundle
# ============================================================

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

# `npm ci` needs the lockfile to match package.json exactly.
RUN npm ci --no-audit --no-fund

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

# Relative API base: nginx reverse-proxies /api to the backend service.
ENV VITE_API_BASE_URL=/api

RUN npm run build

# ============================================================
# Stage 2: serve the bundle with nginx
# ============================================================

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD curl -fsS http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
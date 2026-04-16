# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy everything
COPY . .

# 2. Install and Build using the path from /app
RUN cd front-end/expense-manager && npm install && npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean out default configs
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 3. THE FINAL FIX: Use the relative paths from the /app root
# Based on your logs, Vite is outputting to this exact location:
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 4. Copy the config using the same absolute logic
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 5. Permissions & Bypass for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
ENTRYPOINT ["nginx", "-g", "daemon off;"]
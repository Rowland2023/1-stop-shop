# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy the entire repo
COPY . .

# 2. Move to the app folder and install/build
WORKDIR /app/front-end/expense-manager
RUN npm install
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# 3. CRITICAL: Remove default config to prevent "Duplicate Port" error
RUN rm /etc/nginx/conf.d/default.conf

# 4. Copy the freshly built files
# Based on your logs, they are in /app/front-end/expense-manager/dist
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 5. Copy your Nginx config
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 6. Render Permissions Fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
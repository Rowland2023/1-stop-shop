# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY . .
RUN cd front-end/expense-manager && npm install && npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# 1. Clear everything
RUN rm -rf /etc/nginx/conf.d/* /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# 2. Copy your built files
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 3. Copy your specific config to a name that CANNOT be ignored
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/main.conf

# 4. Permissions for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

USER nginx
EXPOSE 10000

# THE KEY: Bypass the entrypoint scripts entirely
CMD ["nginx", "-g", "daemon off;"]
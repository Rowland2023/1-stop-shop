# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copy everything to /app
COPY . .

# 2. Build using absolute paths from the root /app
# This ensures the dist folder is exactly where we think it is
RUN cd front-end/expense-manager && npm install && npm run build

# --- STAGE 2: SERVE ---
FROM nginx:alpine

# 1. Clear default configs
RUN rm -rf /etc/nginx/conf.d/*

# 2. THE FIX: Access the files from the /app root of the build stage
# Since we didn't change WORKDIR in stage 1, they are exactly here:
COPY --from=build /app/front-end/expense-manager/dist /usr/share/nginx/html

# 3. Copy your nginx config using the same path logic
COPY --from=build /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 4. Render Permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

USER nginx
EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
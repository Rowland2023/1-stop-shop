# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy the entire repo
COPY . .

# 2. Build the app (Moving into the specific folder)
WORKDIR /app/front-end/expense-manager
RUN npm install && npm run build

# 3. THE FIX: Move results to the Golden Path using ABSOLUTE paths
# This ensures 'cp' finds the dist folder regardless of current WORKDIR
RUN mkdir -p /app/final_assets && \
    cp -r /app/front-end/expense-manager/dist/* /app/final_assets/ && \
    find /app -name "nginx.conf" -exec cp {} /app/final_nginx.conf \;

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# 4. Copy from the "Golden Path" created in Stage 1
COPY --from=build-stage /app/final_assets /usr/share/nginx/html
COPY --from=build-stage /app/final_nginx.conf /etc/nginx/conf.d/default.conf

# 5. Permissions for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
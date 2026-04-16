# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY . .

# Move to the specific app folder
WORKDIR /app/front-end/expense-manager
RUN npm install && npm run build

# THE FIX: Move the results to a "Golden Path" so Stage 2 can't miss them
RUN mkdir -p /app/final_assets && \
    cp -r dist/* /app/final_assets/ && \
    find /app -name "nginx.conf" -exec cp {} /app/final_nginx.conf \;

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# 1. Clean default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copy from the "Golden Path"
# This ensures we aren't guessing if it's in /app/dist or /app/front-end...
COPY --from=build-stage /app/final_assets /usr/share/nginx/html
COPY --from=build-stage /app/final_nginx.conf /etc/nginx/conf.d/default.conf

# 3. Permissions for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]
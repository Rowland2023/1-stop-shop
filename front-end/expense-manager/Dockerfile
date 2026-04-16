# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy everything
COPY . .

# 2. Build where the package.json is
RUN PROJ_PATH=$(find . -name "package.json" -not -path "*/node_modules/*" -exec dirname {} \;) && \
    cd "$PROJ_PATH" && \
    npm install && \
    npm run build && \
    # THE TRACE FIX: Find the dist folder we just made and move it to /app/final_dist
    mkdir -p /app/final_dist && \
    cp -r dist/* /app/final_dist/ && \
    # Find the nginx.conf and move it to /app/final_nginx.conf
    find /app -name "nginx.conf" -exec cp {} /app/final_nginx.conf \;

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean out default Nginx files
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 3. Copy from our verified 'final' locations
COPY --from=build-stage /app/final_dist /usr/share/nginx/html
COPY --from=build-stage /app/final_nginx.conf /etc/nginx/conf.d/default.conf

# 4. Permissions for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
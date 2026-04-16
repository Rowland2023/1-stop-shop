# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy everything
COPY . .

# 2. Find the directory containing package.json and build it
# This bypasses the "No such file or directory" error by finding it dynamically
RUN export TARGET_DIR=$(find . -name "package.json" -not -path "*/node_modules/*" -exec dirname {} \;) && \
    echo "Building in: $TARGET_DIR" && \
    cd "$TARGET_DIR" && \
    npm install && \
    npm run build && \
    # Move the output to a predictable location
    mv dist /app/build_output

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean out default Nginx files
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 3. Copy the files from our predictable location
COPY --from=build-stage /app/build_output /usr/share/nginx/html

# 4. Copy your nginx.conf (Finding it dynamically as well)
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 5. Permissions for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# Use a direct CMD to avoid the entrypoint scripts that cause port conflicts
CMD ["nginx", "-g", "daemon off;"]
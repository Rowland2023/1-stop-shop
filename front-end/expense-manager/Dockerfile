# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy everything
COPY . .

# 2. THE FAIL-SAFE BUILD: 
# This command finds the directory containing package.json and builds there
RUN TARGET_DIR=$(find . -name "package.json" -not -path "*/node_modules/*" -exec dirname {} \;) && \
    echo "Building in: $TARGET_DIR" && \
    cd "$TARGET_DIR" && \
    npm install && \
    npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 3. GRAB THE FILES
# We use a wildcard to grab the dist folder wherever it was created
COPY --from=build-stage /app/**/dist /usr/share/nginx/html

# 4. GRAB THE CONFIG
# This looks for any nginx.conf in your subfolders and copies it
COPY --from=build-stage /app/**/nginx.conf /etc/nginx/conf.d/default.conf

# 5. Permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
ENTRYPOINT ["nginx", "-g", "daemon off;"]
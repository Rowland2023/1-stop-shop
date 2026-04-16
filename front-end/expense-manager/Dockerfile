# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copy the whole repo
COPY . .

# 2. Find the project, build it, and move files to a predictable top-level folder
RUN PROJ_PATH=$(find . -name "package.json" -not -path "*/node_modules/*" -exec dirname {} \;) && \
    echo "Building in: $PROJ_PATH" && \
    cd "$PROJ_PATH" && \
    npm install && \
    npm run build && \
    # Flatten the dist folder
    mkdir -p /app/final_dist && \
    cp -r dist/* /app/final_dist/ && \
    # Flatten the nginx.conf - find it wherever it is and move it to /app/final_nginx.conf
    find /app -name "nginx.conf" -exec cp {} /app/final_nginx.conf \;

# --- STAGE 2: SERVE ---
FROM nginx:alpine

# Remove default configs
RUN rm -rf /etc/nginx/conf.d/*

# 3. Copy from the "Flat" predictable locations
COPY --from=build /app/final_dist /usr/share/nginx/html
COPY --from=build /app/final_nginx.conf /etc/nginx/conf.d/default.conf

# 4. Render Permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

USER nginx
EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
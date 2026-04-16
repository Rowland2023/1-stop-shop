# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copy everything
COPY . .

# 2. DEBUG: This will print your actual folder names in the logs
RUN ls -R

# 3. Dynamic Build: Find wherever the package.json is and build there
RUN PROJ_PATH=$(find . -name "package.json" -not -path "*/node_modules/*" -exec dirname {} \;) && \
    echo "I found your project in: $PROJ_PATH" && \
    cd "$PROJ_PATH" && \
    npm install && \
    npm run build && \
    # Move the result to a safe place at the root
    mkdir -p /app/final_dist && \
    cp -r dist/* /app/final_dist/

# --- STAGE 2: SERVE ---
FROM nginx:alpine
RUN rm -rf /etc/nginx/conf.d/*

# Copy from the safe 'final_dist' we created
COPY --from=build /app/final_dist /usr/share/nginx/html

# Find and copy nginx.conf dynamically
COPY --from=build /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

USER nginx
EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]
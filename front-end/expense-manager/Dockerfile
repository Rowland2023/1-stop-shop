# Stage 1: Build
FROM node:18-alpine AS build-stage
WORKDIR /app

# 1. Copy everything to ensure context is preserved
COPY . .

# 2. MOVE into the actual project folder to run the build
WORKDIR /app/front-end/expense-manager

# 3. Install and Build where the package.json actually lives
RUN npm install
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Surgical strike to prevent the port 10000 conflict
RUN rm -f /docker-entrypoint.d/* && rm -rf /etc/nginx/conf.d/*

# 4. THE CRITICAL COPY: 
# We copy from the 'dist' folder INSIDE the subfolder we just built in
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 5. Copy your config
COPY front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Permissions fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# Run directly to avoid entrypoint logic
ENTRYPOINT ["nginx", "-g", "daemon off;"]
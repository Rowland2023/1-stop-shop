# Stage 1: Build
FROM node:18-alpine AS build-stage
WORKDIR /app

# Copy the package files from the deep nested directory
COPY front-end/expense-manager/package*.json ./
RUN npm install

# Copy the rest of the frontend source code from the subfolder
COPY front-end/expense-manager/ ./

# Run the Vite build
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Remove automation scripts that cause the port conflict
RUN rm -f /docker-entrypoint.d/* && rm -rf /etc/nginx/conf.d/*

# 1. COPY the built files from the build-stage
# Vite always puts these in 'dist' relative to the WORKDIR
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 2. THE FIX: Copy the nginx.conf
# We use a wildcard or relative path to ensure it's found
# This path is relative to your GITHUB ROOT
COPY ./front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Permissions fix for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# Skip the entrypoint scripts that cause the duplicate 10000 error
ENTRYPOINT ["nginx", "-g", "daemon off;"]
# Stage 1: Build
FROM node:18-alpine AS build-stage
WORKDIR /app

# 1. Copy the entire repo into the container
COPY . .

# 2. Build the project inside the subfolder
WORKDIR /app/front-end/expense-manager
RUN npm install
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Surgical strike to prevent the port 10000 conflict
RUN rm -f /docker-entrypoint.d/* && rm -rf /etc/nginx/conf.d/*

# 3. COPY the built files from the build-stage
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 4. THE FIX: Copy the config file from the BUILD-STAGE, not the local path
# This ensures Docker doesn't have to "find" the file in the context again
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Permissions fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

ENTRYPOINT ["nginx", "-g", "daemon off;"]
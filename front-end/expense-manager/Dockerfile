# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy the entire repo so we have the subfolder structure
COPY . .

# Move into the folder where package.json actually lives
WORKDIR /app/front-end/expense-manager

RUN npm install
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean out the directories
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 1. Copy the build artifacts from the correct subfolder
# Vite puts 'dist' inside the folder where 'npm run build' was executed
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 2. Copy the config from the subfolder where you stored it
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 3. Permissions fix for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
ENTRYPOINT ["nginx", "-g", "daemon off;"]
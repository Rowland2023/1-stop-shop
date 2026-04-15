# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# This creates the 'dist' (or 'build') folder
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clear the conflicting Nginx scripts
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 1. Correct the Source Path for your config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 2. Correct the Source Path for your Build Files
# If your project is Vite, use 'dist'. If Create-React-App, use 'build'.
# Since the Dockerfile is in 'expense-manager', this path is relative to that.
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 3. Bypass the buggy entrypoint to maintain the port 10000 fix
ENTRYPOINT ["nginx", "-g", "daemon off;"]

EXPOSE 10000
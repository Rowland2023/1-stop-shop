# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy the entire repo
COPY . .

# 2. Build the project
# We use '&&' to stay in the same shell context for the build
RUN cd front-end/expense-manager && npm install && npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean default Nginx files
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 3. THE FIX: Grab the files from the specific absolute paths
# Based on your logs, the files live here in the build-stage:
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 4. Grab the config
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 5. Permissions fix for Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
ENTRYPOINT ["nginx", "-g", "daemon off;"]
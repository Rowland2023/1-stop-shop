# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy everything from the CURRENT folder (expense-manager)
COPY . .

# 2. Install and Build (You are already in /app, which is expense-manager)
RUN npm install && npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# 3. COPY THE DIST FILES
# Since we built in /app, the dist folder is at /app/dist
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 4. COPY THE NGINX CONFIG
# If nginx.conf is in a folder named 'nginx' inside your current directory:
COPY --from=build-stage /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf
# IF it's just sitting in the root, use: COPY --from=build-stage /app/nginx.conf ...

# Render Permissions Fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
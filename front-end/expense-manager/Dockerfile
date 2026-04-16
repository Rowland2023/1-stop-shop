# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy everything
COPY . .

# 2. Let's find exactly where the package.json is.
# We will use WORKDIR to move into the directory.
# If your folder names are capitalized, change them here!
WORKDIR /app/front-end/expense-manager

# 3. Install and Build
RUN npm install && npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Remove default config to prevent the "Duplicate Port" error
RUN rm /etc/nginx/conf.d/default.conf

# 4. Copy built files from the build-stage
# We use the absolute path from Stage 1
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 5. Copy Nginx config
# Double check: Is it in a folder named 'nginx' or just 'expense-manager'?
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Render Permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
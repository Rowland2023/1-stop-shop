# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build
WORKDIR /app

# Copy the entire repository
COPY . .

# Move into your specific sub-folder
WORKDIR /app/front-end/expense-manager

# Install and build
RUN npm install
RUN npm run build

# --- STAGE 2: SERVE ---
FROM nginx:alpine

# 1. Remove default Nginx configs
RUN rm -rf /etc/nginx/conf.d/*

# 2. COPY the built files from the deep sub-folder to the Nginx root
# This "flattens" your structure so Nginx can find it easily
COPY --from=build /app/front-end/expense-manager/dist /usr/share/nginx/html

# 3. Copy your nginx config
COPY --from=build /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 4. Render Permissions Fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

USER nginx
EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
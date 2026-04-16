# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# 1. Copy everything from the current folder (expense-manager)
COPY . .

# 2. Build the app
RUN npm install && npm run build

# 3. MOVE FILES TO A PREDICTABLE SPOT
# We move 'dist' and 'nginx.conf' to the root /app for easy grabbing
RUN mv dist /app/final_dist && \
    find . -name "nginx.conf" -exec mv {} /app/final_nginx.conf \;

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# 4. Copy from our predictable spots
COPY --from=build-stage /app/final_dist /usr/share/nginx/html
COPY --from=build-stage /app/final_nginx.conf /etc/nginx/conf.d/default.conf

# 5. Render Permissions Fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
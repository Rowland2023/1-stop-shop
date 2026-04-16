# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. THE FIX: Install ALL dependencies (including Vite)
# We need devDependencies to run the 'build' command
RUN npm install

# 3. Copy the rest of the source code
COPY . .

# 4. Generate the 'dist' folder
RUN npm run build

# --- STAGE 2: SERVE ---
FROM nginx:alpine

# 1. Remove default config to prevent port/host conflicts
RUN rm -rf /etc/nginx/conf.d/*

# 2. Copy build output from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# 3. Copy custom config
# Ensure your local path 'nginx/nginx.conf' is correct
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 4. Permissions fix for Render's non-root execution
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# 5. Run as nginx user for better security/compatibility
USER nginx

CMD ["nginx", "-g", "daemon off;"]
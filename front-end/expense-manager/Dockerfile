# Stage 1: Build the React App
FROM node:18-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# This creates the /app/build folder inside the container
RUN npm run build

# Stage 2: Setup Nginx
FROM nginx:alpine

# Remove automation scripts that cause the "duplicate listen" error
RUN rm -f /docker-entrypoint.d/* \
    && rm -rf /etc/nginx/conf.d/*

# Copy the build output from Stage 1 (no longer depends on your local/git build folder)
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy your local nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions for Render
RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# Use the absolute path to ensure we bypass any remaining shell logic
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
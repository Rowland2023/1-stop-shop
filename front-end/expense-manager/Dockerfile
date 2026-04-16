# Stage 1: Build (Inside front-end/expense-manager)
FROM node:18-alpine AS build-stage
WORKDIR /app
# Copy the package files from your specific nested directory
COPY front-end/expense-manager/package*.json ./
RUN npm install
COPY front-end/expense-manager/ ./
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
RUN rm -f /docker-entrypoint.d/* && rm -rf /etc/nginx/conf.d/*
# Vite outputs to 'dist'
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Permissions & Entrypoint
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx
EXPOSE 10000
ENTRYPOINT ["nginx", "-g", "daemon off;"]
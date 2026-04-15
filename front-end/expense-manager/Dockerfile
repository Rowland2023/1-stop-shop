# Stage 1: Build
FROM node:18-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
RUN rm -f /docker-entrypoint.d/* && rm -rf /etc/nginx/conf.d/*

# CRITICAL: Copy from the specific sub-folder created by your build
# Adjust "build" to "dist" if you are using Vite
COPY --from=build-stage /app/front-end/expense-manager /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
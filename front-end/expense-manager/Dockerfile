# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean conflict-prone directories
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# SOLUTION: Remove the "./front-end/expense-manager/" prefix.
# If this Dockerfile is inside the expense-manager folder, 
# 'nginx/' is all you need.
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Same for the build files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# The bypass fix we verified earlier
ENTRYPOINT ["nginx", "-g", "daemon off;"]
EXPOSE 10000
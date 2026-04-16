# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy the entire project
COPY . .

# Move into the specific folder where package.json lives
WORKDIR /app/front-end/expense-manager

RUN npm install
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean conflict-prone directories
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 1. Copy config
COPY front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 2. THE FIX: Points to the exact path where the dist folder was created
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 3. Bypass startup scripts to maintain the 200 OK status
ENTRYPOINT ["nginx", "-g", "daemon off;"]
EXPOSE 10000
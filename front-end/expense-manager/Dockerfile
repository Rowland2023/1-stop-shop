# --- STAGE 1: BUILD ---
# Use Node 20 to support modern Vite/CustomEvent requirements
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# 1. Clean out the directories as we did before
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 2. Copy the config using the relative path that worked
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copy build artifacts (Usually 'dist' for Vite)
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 4. Keep the bypass for the duplicate listen error
ENTRYPOINT ["nginx", "-g", "daemon off;"]

EXPOSE 10000
# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# 1. Clean out the directories that trigger the Nginx helper scripts
RUN rm -f /docker-entrypoint.d/* && rm -rf /etc/nginx/conf.d/*

# 2. Correct Path: Using the folder structure you provided
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copy build files 
# Check if your build output is 'dist' (Vite) or 'build' (CRA)
# Based on your previous logs, I'll use /app/dist
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 4. The Kill Switch: Bypass the entrypoint scripts to stop the "duplicate listen" error
ENTRYPOINT ["nginx", "-g", "daemon off;"]

EXPOSE 10000
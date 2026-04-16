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

# 1. Copy config from the subfolder we identified earlier
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 2. TRACE CHECK: 
# If your project uses Vite, the folder is 'dist'. 
# If you are NOT using a build tool and just want to serve raw files, 
# you would use 'COPY . /usr/share/nginx/html'
COPY --from=build-stage /app/dist /usr/share/nginx/html

ENTRYPOINT ["nginx", "-g", "daemon off;"]
EXPOSE 10000
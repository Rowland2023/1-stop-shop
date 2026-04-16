# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# 1. Wipe the default configs completely
RUN rm -rf /etc/nginx/conf.d/* /etc/nginx/nginx.conf

# 2. Copy your config to the MAIN nginx config path, not the sub-folder
# This forces Nginx to use YOUR rules as the primary rules.
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# 3. Ensure the folder exists and copy the dist contents
RUN mkdir -p /usr/share/nginx/html
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 4. Explicitly start nginx using the config we just moved
ENTRYPOINT ["nginx", "-g", "daemon off;"]
EXPOSE 10000
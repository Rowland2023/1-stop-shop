# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:stable-alpine

# 1. DELETE the default file so the script has nothing to "fix"
RUN rm -f /etc/nginx/conf.d/default.conf

# 2. Copy your config with a UNIQUE name
# The script ONLY targets "default.conf", so it will ignore "frontend.conf"
COPY nginx/nginx.conf /etc/nginx/conf.d/frontend.conf

# 3. Copy build files
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 10000

# 4. We use the standard Nginx start command
CMD ["nginx", "-g", "daemon off;"]
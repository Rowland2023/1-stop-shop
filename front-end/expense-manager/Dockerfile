# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy dependency files first
COPY package*.json ./
RUN npm install

# Copy source and build (This creates the /app/dist folder)
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:stable-alpine

# 1. Remove the default Nginx config to prevent "duplicate listen" error
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copy your custom nginx.conf
# Note: Ensure the path to your nginx.conf is correct (e.g., ./nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copy the 'dist' folder from the build-stage to Nginx's HTML folder
# Note: Vite uses 'dist', Create-React-App uses 'build'. Match this to your project.
COPY ./build /usr/share/nginx/html

# 4. Tell Render to use Port 10000
EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
# --- STAGE 1: BUILD ---
# Use Node 20 to fix the "CustomEvent is not defined" Vite error
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:stable-alpine

# 1. Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copy your custom config (Ensure the path is correct!)
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copy the build output
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 4. Port for Render
EXPOSE 10000

# 5. Start Nginx
CMD ["nginx", "-g", "daemon off;"]
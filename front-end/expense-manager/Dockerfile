# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:stable-alpine

# 1. Create the templates directory
RUN mkdir -p /etc/nginx/templates

# 2. Copy your template there. 
# The Nginx entrypoint will automatically process this into /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf.template /etc/nginx/templates/default.conf.template

# 3. Copy the build files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 4. Render's default port
ENV PORT 10000
EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
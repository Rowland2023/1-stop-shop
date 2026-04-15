# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:stable-alpine

# 1. COMPLETELY WIPE the directories where the "duplicate" error comes from
RUN rm -rf /etc/nginx/conf.d/*
RUN rm -rf /docker-entrypoint.d/*

# 2. OVERWRITE the main nginx.conf instead of adding a sub-config
# This ignores everything in conf.d entirely
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# 3. Copy your frontend files (assuming 'dist' is your output)
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 4. Explicitly tell Render the port
ENV PORT 10000
EXPOSE 10000

# 5. Start Nginx using the main config only
CMD ["nginx", "-g", "daemon off;"]
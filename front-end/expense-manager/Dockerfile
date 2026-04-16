# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# --- STAGE 2: SERVE ---
FROM nginx:alpine

# Remove default config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]

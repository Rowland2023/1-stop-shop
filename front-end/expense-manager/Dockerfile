# Build stage (Vite/React)
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage (Nginx)
FROM nginx:stable-alpine
# COPY the build output
COPY --from=build-stage /app/dist /usr/share/nginx/html
# COPY your custom nginx config to replace the default
# Change 'nginx/nginx.conf' to match the actual folder path in your repo
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]
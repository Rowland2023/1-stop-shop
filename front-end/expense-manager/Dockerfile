# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy the entire project
COPY . .

# Move into the folder and build
WORKDIR /app/front-end/expense-manager
RUN npm install
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# 1. Clean default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# 2. COPY THE DIST FILES
# Vite puts files in the current WORKDIR's dist folder. 
# We use the absolute path from the build-stage root.
COPY --from=build-stage /app/front-end/expense-manager/dist /usr/share/nginx/html

# 3. COPY THE NGINX CONFIG
# Verify that 'nginx.conf' is actually inside a folder named 'nginx' 
# inside 'expense-manager'
COPY --from=build-stage /app/front-end/expense-manager/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 4. Render Permissions Fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
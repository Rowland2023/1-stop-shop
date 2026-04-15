FROM nginx:alpine

# 1. Delete ALL default configurations to prevent collisions
RUN rm /etc/nginx/conf.d/default.conf && rm /etc/nginx/nginx.conf

# 2. Copy your custom config directly to the main nginx path
# This prevents the entrypoint scripts from messing with it
COPY nginx.conf /etc/nginx/nginx.conf

# 3. Copy your React build files
COPY ./build /usr/share/nginx/html

# 4. Port 10000 for Render
EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
FROM nginx:alpine

# 1. Scrub all default Nginx configs and templates
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -rf /etc/nginx/nginx.conf && \
    rm -rf /etc/nginx/templates

# 2. Copy your clean config
COPY nginx.conf /etc/nginx/nginx.conf

# 3. Copy your React build files
# Make sure your 'build' folder is in the same directory as this Dockerfile
COPY ./build /usr/share/nginx/html

# 4. Fix permissions for the nginx user (required for some Render environments)
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx

# 5. Verify configuration syntax during build
RUN nginx -t

EXPOSE 10000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
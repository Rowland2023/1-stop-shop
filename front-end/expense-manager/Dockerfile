FROM nginx:alpine

# 1. Forcefully remove EVERYTHING in the config directories
# This stops the entrypoint scripts from finding templates to build duplicates
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -rf /etc/nginx/nginx.conf && \
    rm -rf /etc/nginx/templates

# 2. Copy your clean, single-block config
COPY nginx.conf /etc/nginx/nginx.conf

# 3. Copy your React build
COPY ./build /usr/share/nginx/html

# 4. Fix permissions for the nginx user
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx

# 5. Verify the syntax - if this fails, the build stops here
RUN nginx -t

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
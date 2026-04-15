FROM nginx:alpine

# 1. Purge every possible config location
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -rf /etc/nginx/nginx.conf && \
    rm -rf /etc/nginx/templates

# 2. Copy your clean, verified config
COPY nginx.conf /etc/nginx/nginx.conf

# 3. Copy your React build files
COPY ./build /usr/share/nginx/html

# 4. Standard Render permissions for the nginx user
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# 5. THE FIX: Directly call the binary via its absolute path.
# This prevents /docker-entrypoint.sh from even starting.
ENTRYPOINT ["/usr/sbin/nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
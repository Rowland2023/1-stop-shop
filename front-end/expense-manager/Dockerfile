FROM nginx:alpine

# Clean all default configs
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -rf /etc/nginx/nginx.conf && \
    rm -rf /etc/nginx/templates

# Copy your build and config
COPY nginx.conf /etc/nginx/nginx.conf
COPY ./build /usr/share/nginx/html

# Permissions for Render's read-only filesystem layers
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE ${PORT}


# THE CRITICAL CHANGE: Bypass the /docker-entrypoint.sh script entirely
ENTRYPOINT ["nginx", "-g", "daemon off;"]

FROM nginx:alpine

# Remove default configs to avoid duplicate listen directives
RUN rm -rf /etc/nginx/conf.d/* \
    && rm -rf /etc/nginx/nginx.conf \
    && rm -rf /etc/nginx/templates

# Copy your custom config and build output
COPY nginx.conf /etc/nginx/nginx.conf
COPY ./build /usr/share/nginx/html

# Fix permissions for Render's read-only filesystem layers
RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

# Expose the dynamic port (informational only)
EXPOSE ${PORT}

# Start Nginx directly
ENTRYPOINT ["nginx", "-g", "daemon off;"]

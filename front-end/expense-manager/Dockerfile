FROM nginx:alpine

# 1. Clear out every possible configuration source during build
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -rf /etc/nginx/nginx.conf && \
    rm -rf /etc/nginx/templates

# 2. Copy your clean, standalone config
COPY nginx.conf /etc/nginx/nginx.conf

# 3. Copy your React build files
COPY ./build /usr/share/nginx/html

# 4. Standard Render permissions fix for the nginx user
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# 5. THE FIX: Bypass the /docker-entrypoint.sh script entirely.
# This ensures that "20-envsubst-on-templates.sh" NEVER runs.
ENTRYPOINT ["nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
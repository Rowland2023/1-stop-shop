FROM nginx:alpine

# 1. Clear out everything during build
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -rf /etc/nginx/nginx.conf && \
    rm -rf /etc/nginx/templates

# 2. Copy your clean, verified config
COPY nginx.conf /etc/nginx/nginx.conf

# 3. Copy your React build files
COPY ./build /usr/share/nginx/html

# 4. Standard Render permissions fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# 5. THE CRITICAL FIX: Bypass the shell entrypoint scripts
# This prevents the auto-generation of the conflicting default.conf
ENTRYPOINT ["nginx", "-g", "daemon off;"]
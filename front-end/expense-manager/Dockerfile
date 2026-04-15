FROM nginx:alpine

# 1. Eliminate every possible config source
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -rf /etc/nginx/nginx.conf && \
    rm -rf /etc/nginx/templates

# 2. Copy your clean, standalone config
COPY nginx.conf /etc/nginx/nginx.conf

# 3. Copy your React build
COPY ./build /usr/share/nginx/html

# 4. Standard Render permissions fix
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

# 5. THE FIX: Directly execute the binary. 
# This skips all those .sh scripts in your logs.
ENTRYPOINT ["nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
FROM nginx:alpine

# Remove bundled entrypoint scripts that inject duplicate configs
RUN rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh \
    /docker-entrypoint.d/20-envsubst-on-templates.sh \
    /docker-entrypoint.d/30-tune-worker-processes.sh \
    && rm -rf /etc/nginx/conf.d/*

# Copy your static build and custom config
COPY ./build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions
RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]

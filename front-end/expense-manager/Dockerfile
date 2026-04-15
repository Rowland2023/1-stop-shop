FROM nginx:alpine

# Remove all bundled entrypoint scripts so they can't inject duplicate configs
RUN rm -f /docker-entrypoint.d/* \
    && rm -rf /etc/nginx/conf.d/*

# Copy your static build and custom config
COPY ./build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions
RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]

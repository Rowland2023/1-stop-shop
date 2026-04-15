FROM nginx:alpine

# Remove the default entrypoint script that injects templates
RUN rm /docker-entrypoint.d/20-envsubst-on-templates.sh \
    && rm -rf /etc/nginx/conf.d/*

# Copy your static build and custom config
COPY ./build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions to avoid crashes
RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]

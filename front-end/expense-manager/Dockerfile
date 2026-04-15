FROM nginx:alpine

# THE DIFFERENCE: This line was missing in your previous 'Status Quo' attempts.
# It kills the automation that creates the duplicate.
RUN rm /docker-entrypoint.d/20-envsubst-on-templates.sh

RUN rm -rf /etc/nginx/conf.d/*

COPY ./build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Permissions fix to prevent 'status 1' crashes
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]
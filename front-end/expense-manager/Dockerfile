FROM nginx:alpine

# 1. Surgical Strike: Remove the automation script causing the conflict
RUN rm /docker-entrypoint.d/20-envsubst-on-templates.sh

# 2. Clean out default configs
RUN rm -rf /etc/nginx/conf.d/*

# 3. Copy your React build
COPY ./build /usr/share/nginx/html

# 4. Copy your config (Make sure this file says 'listen 10000;')
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 5. Permission fix for Nginx on Render
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
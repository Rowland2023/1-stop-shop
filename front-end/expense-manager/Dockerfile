FROM nginx:alpine

# 1. DELETE the script that looks for the PORT variable
RUN rm /docker-entrypoint.d/20-envsubst-on-templates.sh

# 2. Delete default configs
RUN rm -rf /etc/nginx/conf.d/*

# 3. Copy your build and your config (using port 10000)
COPY ./build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 10000
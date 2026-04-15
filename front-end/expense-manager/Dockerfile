FROM nginx:alpine

# Clean build-time files
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /etc/nginx/templates

COPY nginx.conf /etc/nginx/nginx.conf
COPY ./build /usr/share/nginx/html

# Bypass the scripts in /docker-entrypoint.d/
ENTRYPOINT ["nginx", "-g", "daemon off;"]
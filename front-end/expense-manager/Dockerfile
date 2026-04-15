FROM nginx:alpine

# 1. Clean out defaults
RUN rm -rf /etc/nginx/conf.d/*

# 2. Put your config in the TEMPLATES folder, NOT the conf.d folder
# Nginx will automatically look here and swap ${PORT} for 10000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

COPY ./build /usr/share/nginx/html

EXPOSE 10000
# Don't use ENTRYPOINT here; let the default CMD handle the template swap
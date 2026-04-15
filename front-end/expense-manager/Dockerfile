FROM nginx:alpine

# Remove ALL existing configs to prevent any duplicates
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /etc/nginx/nginx.conf

# Copy your custom config to the PRIMARY config path
COPY nginx.conf /etc/nginx/nginx.conf

# Copy your built frontend files
COPY ./build /usr/share/nginx/html

# Inform Render we are on 10000
EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
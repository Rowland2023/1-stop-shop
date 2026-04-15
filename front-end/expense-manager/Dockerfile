FROM nginx:alpine

# Remove everything that could possibly hold a config
RUN rm -rf /etc/nginx/conf.d/* \
    && rm -rf /etc/nginx/nginx.conf \
    && rm -rf /etc/nginx/templates  # <--- CRITICAL: Remove the templates too

COPY nginx.conf /etc/nginx/nginx.conf
COPY ./build /usr/share/nginx/html

# Final check: This will fail the build if a duplicate exists
RUN nginx -t

EXPOSE 10000
CMD ["nginx", "-g", "daemon off;"]
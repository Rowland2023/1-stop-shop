# ... (Build stage remains the same)

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean slate
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# Copy config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# CHECK THIS FOLDER: Change 'dist' to 'build' if necessary
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Keep the entrypoint bypass
ENTRYPOINT ["nginx", "-g", "daemon off;"]

EXPOSE 10000
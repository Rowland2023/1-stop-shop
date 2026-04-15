# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:stable-alpine

# 1. Clean out the directory
RUN rm -rf /etc/nginx/conf.d/*

# 2. Copy your config as 'proxy.conf'
# This name prevents the '10-listen-on-ipv6' script from messing with it
COPY nginx/nginx.conf.template /etc/nginx/conf.d/proxy.conf

# 3. Copy build files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 4. Do NOT use ENTRYPOINT []. Let Render use the default.
EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
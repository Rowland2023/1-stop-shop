# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build-stage
WORKDIR /app

# Since Render is scoped to 'expense-manager', 
# '.' here refers to the contents of 'expense-manager'
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM nginx:alpine

# Clean out the default Nginx configs
RUN rm -rf /etc/nginx/conf.d/* && rm -rf /docker-entrypoint.d/*

# 1. CORRECT PATH: No prefix needed because we are already in the subfolder
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 2. ARTIFACT PATH: In Stage 1, we built in /app, so the output is /app/dist
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 3. Bypass the entrypoint bug to maintain the 200 OK
ENTRYPOINT ["nginx", "-g", "daemon off;"]
EXPOSE 10000
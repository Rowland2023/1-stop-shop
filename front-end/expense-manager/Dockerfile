FROM nginx:alpine

# 1. Clear out ANY existing configs to prevent duplicates
RUN rm -rf /etc/nginx/conf.d/*

# 2. Copy your template to the 'templates' folder
# The 20-envsubst-on-templates.sh script will process this automatically
COPY default.conf.template /etc/nginx/templates/default.conf.template

# 3. Copy your React build
COPY ./build /usr/share/nginx/html

EXPOSE 10000

# Do NOT use a custom ENTRYPOINT here. 
# We WANT the default /docker-entrypoint.sh to run so it can process the template.
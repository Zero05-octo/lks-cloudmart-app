# CloudMart Frontend
FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY src/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

# Usando una imagen base de Nginx para servir archivos estáticos
FROM nginx:alpine

# Copiar archivos estáticos al directorio de Nginx
COPY ./src /usr/share/nginx/html

# Copiar la página de error 404
COPY ./404.html /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar certificados SSL
COPY ssl /etc/nginx/ssl

# Exponer puertos necesarios
EXPOSE 80
EXPOSE 443

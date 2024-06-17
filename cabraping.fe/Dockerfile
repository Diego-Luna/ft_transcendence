FROM nginx:alpine

COPY ./src /usr/share/nginx/html

RUN apk add openssl &&\
    openssl req -x509 -nodes -days 365 -newkey rsa:2048\
        -keyout /etc/ssl/private/nginx-selfsigned.key\
        -out /etc/ssl/certs/nginx-selfsigned.crt\
        -subj "/C=FR/ST=IDF/L=Paris/O=42Network/OU=42Paris/CN=cabraping.42.fr"

COPY ./404.html /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443


# FROM nginx:alpine


# COPY ./src /usr/share/nginx/html

# RUN		apk add openssl &&\
# 		openssl req -x509 -nodes -days 365 -newkey rsa:2048\
# 			-keyout /etc/ssl/private/nginx-selfsigned.key\
# 			-out /etc/ssl/certs/nginx-selfsigned.crt\
# 			-subj "/C=FR/ST=IDF/L=Paris/O=42Network/OU=42Paris/CN=cabraping.42.fr"

# COPY ./404.html /usr/share/nginx/html


# COPY nginx.conf /etc/nginx/nginx.conf


# # COPY ssl /etc/nginx/ssl

# EXPOSE 80
# EXPOSE 443

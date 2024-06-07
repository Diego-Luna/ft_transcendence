FROM alpine:3.18.3

RUN apk update && apk upgrade && apk --no-cache add \
    nginx   \
    openssl

COPY nginx/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /run/nginx
RUN mkdir -p /ext
RUN mkdir -p /etc/nginx/ssl

RUN openssl req -x509 -noenc  \
        -out /etc/nginx/ssl/transcendence.crt       \
        -keyout /etc/nginx/ssl/transcendence.key    \
        -subj '/C=CN/ST=QC/L=Quebec/O=42/OU=transcendence/CN=transcendence.42.fr'

EXPOSE 443

ENTRYPOINT [ "nginx" , "-g", "daemon off;" ] 
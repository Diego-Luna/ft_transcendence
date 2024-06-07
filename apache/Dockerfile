# apache/Dockerfile
FROM httpd:2.4

RUN apt-get update && \
    apt-get install -y \
    vim \
    wget \
    procps \
    certbot \
    python3-certbot-apache

COPY apache/my-httpd.conf /usr/local/apache2/conf/my-httpd.conf
COPY apache/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY apache/certbot.sh /usr/local/bin/certbot.sh

RUN chmod +x /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/certbot.sh

CMD ["entrypoint.sh"]

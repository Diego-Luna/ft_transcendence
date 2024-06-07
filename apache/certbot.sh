#!/bin/bash

# Start Apache
httpd-foreground &

# Sleep for a few seconds to ensure Apache is up
sleep 10

# Run Certbot to obtain SSL certificates
certbot --apache --non-interactive --agree-tos --email your@email.com -d myapp.com

# Keep container running
tail -f /dev/null
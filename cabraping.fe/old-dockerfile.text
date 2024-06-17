# Using a Node.js base image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the file 'package.json' and 'package-lock.json' (if available)
# COPY ./cabraping.fe/package*.json ./

# Install project dependencies
RUN npm install -g serve

# Copying the rest of the project source code to the container
COPY ./cabraping.fe .

# Build the application for production
# RUN npm run build

# Expose the port used by your application
EXPOSE 8080

# Command to serve the application using a simple HTTP server to serve static files.
CMD ["npx", "serve", "-s", "src", "-l", "8080"]
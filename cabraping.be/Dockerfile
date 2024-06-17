# We use an official Python base image
FROM python:3.9-slim

# Sets the working directory in the container
WORKDIR /app

# We update the packages and install netcat-openbsd
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# We copy the requirements files first to take advantage of Docker's layer cache.
COPY ./pip_environment_dependencies.txt /app/

# We install the project dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r pip_environment_dependencies.txt

# We copy the rest of the project source code to the container.
COPY ./ /app

COPY ./entrypoint.sh /app/

# Ensure that the input script is executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]

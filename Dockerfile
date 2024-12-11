# Use an official Node.js image as the base
FROM node:20

# Set environment variable for non-interactive installation
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /home/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install \
    && npm install -g npm@10.9.2 \
    && npm install -g nodemon

# Install ffmpeg and related packages
RUN apt-get update \
    && apt-get install -y apt-utils ffmpeg libavcodec-extra \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Reset DEBIAN_FRONTEND to default
ENV DEBIAN_FRONTEND=dialog

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 500

# Start the application
CMD ["node", "server.js"]

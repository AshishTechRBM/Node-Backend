# Use an official Node.js image as the base
FROM node:20

# Set working directory
WORKDIR /home/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Install Node.js dependencies
RUN npm install -g npm@10.9.2

# Install apt-utils to suppress the debconf warning
RUN apt-get update && apt-get install -y apt-utils

# Install FFmpeg
RUN apt-get install -y ffmpeg


# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 500

# Start the application
CMD ["node", "server.js"]

# Use an official Node.js image as the base
FROM node:20

# Set working directory
WORKDIR /home/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install \
    && npm install -g npm@10.8.2 \
    && npm install -g nodemon

# Install ffmpeg package
RUN apt-get update \
    && apt-get install -y ffmpeg libavcodec-extra \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 500

# Start the application
CMD ["node", "server.js"]

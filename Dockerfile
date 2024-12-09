# Use an official Ubuntu focal image as the base
FROM node:20

# Set working directory
WORKDIR /home/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install nodemon globally
RUN npm install -g nodemon

# Expose the port the app runs on
EXPOSE 3000

# Use nodemon for auto-restarting the app in development
CMD ["node", "server.js"]



# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy application files
COPY package*.json ./
RUN npm install
COPY . .

# Expose port
EXPOSE 8080

# Run the app
CMD ["node", "app.js"]

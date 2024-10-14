# Use the official Nginx image from the Docker Hub
FROM nginx:latest

# Copy the default configuration file to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

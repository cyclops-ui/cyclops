FROM node:18.0-alpine
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY ./ ./
RUN npm install -f
CMD ["npm", "run", "prod"]

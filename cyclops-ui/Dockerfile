#FROM node:18.0-alpine
#WORKDIR /app
#COPY package.json ./
#COPY package-lock.json ./
#COPY ./ ./
#RUN npm install -f
#CMD ["npm", "run", "prod"]


FROM node:18.0-alpine as build
WORKDIR /usr/src/app

COPY package* ./
COPY . .

RUN npm install -f
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build

# -- RELEASE --
FROM nginx:stable-alpine as release

COPY --from=build /usr/src/app/build /usr/share/nginx/html
# copy .env.example as .env to the release build
COPY --from=build /usr/src/app/.env /usr/share/nginx/html/.env
COPY --from=build /usr/src/app/nginx/default.conf /etc/nginx/conf.d/default.conf

RUN apk add --update nodejs
RUN apk add --update npm
RUN npm install -g runtime-env-cra@0.2.2

WORKDIR /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "runtime-env-cra && nginx -g \"daemon off;\""]

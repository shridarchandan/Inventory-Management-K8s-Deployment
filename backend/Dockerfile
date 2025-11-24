FROM node:20.11.0-alpine AS build
WORKDIR /usr/src/app

COPY package.* ./
RUN npm install

COPY . .



FROM node:20.11.0-alpine
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/ ./
EXPOSE 5000
CMD ["node", "server.js"]

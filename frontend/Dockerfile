FROM node:20.11.0-alpine AS build
WORKDIR /usr/src/app
COPY package.* .
RUN npm install

COPY . .
RUN npm run build

FROM node:20.11.0-alpine
WORKDIR /usr/src/app

COPY --from=build /usr/src/app .
EXPOSE 3000
CMD ["npm","start"]

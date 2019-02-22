FROM node:10-alpine

WORKDIR /bluefin

COPY . .

RUN apk add --no-cache bash==4.4.19-r1

RUN apk add --no-cache git==2.18.1-r0
RUN apk add postgresql-dev gcc musl-dev postgresql-client

RUN yarn install

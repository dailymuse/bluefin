FROM node:10-alpine

ARG GEMFURY_TOKEN
ENV GEMFURY_TOKEN=${GEMFURY_TOKEN}

WORKDIR /bluefin

COPY . .

RUN apk add --no-cache bash==5.0.11-r1

RUN apk add --no-cache git~=2.20
RUN apk add postgresql-dev gcc musl-dev postgresql-client

RUN yarn install

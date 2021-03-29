FROM node:alpine

RUN mkdir /home/ace-event-server

WORKDIR /home/ACE-Event-Server

COPY package.json package.json
COPY server.js server.js

RUN npm install --production

CMD npm run start-prod
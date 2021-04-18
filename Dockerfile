FROM node:alpine

RUN mkdir /home/ace-event-server

WORKDIR /home/ace-event-server

COPY package.json package.json
COPY server.js server.js
COPY success.html success.html

RUN npm install --production

CMD npm run start-prod
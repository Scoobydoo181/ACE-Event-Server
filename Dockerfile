FROM node:alpine

RUN mkdir /home/ace-event-server

ADD . /home/ace-event-server

WORKDIR /home/ACE-Event-Server

RUN npm install --production

CMD npm run start
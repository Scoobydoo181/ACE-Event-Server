FROM node

RUN npm install

COPY . /home/ACE-Event-Server

WORKDIR /home/ACE-Event-Server

CMD npm run start
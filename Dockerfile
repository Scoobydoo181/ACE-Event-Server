FROM node

COPY . /home/ACE-Event-Server

WORKDIR /home/ACE-Event-Server

RUN npm install

CMD npm run start
# ACE-Event-Server
A server for the University of Florida Association of Computer Engineers to aid in event management

To run the server locally:
- ```npm install```
- ```npm run start-prod```

To run the server using docker:
- ```docker build -t ace-event .```
- ```docker run -d -p 3000:3000 ace-event```

The server is built to respond to requests from Slack and will not function outside of the cluster it currently runs on. It expects very specific request formats and authentication tokens from Slack running it locally will have no effect.

FROM node:14-alpine

COPY . .

RUN npm install --silent

RUN echo "Test docker container was built"

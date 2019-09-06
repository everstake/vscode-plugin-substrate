FROM node:10-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json yarn.lock /usr/src/app/
RUN yarn install --silent
COPY . .

CMD ["yarn", "watch"]

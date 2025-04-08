FROM node:lts as audio-transcriber

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

FROM audio-transcriber

WORKDIR /

RUN pip install onnx-simplifier
COPY package*.json ./

RUN npm install

COPY . .



CMD [ "npm", "start" ]
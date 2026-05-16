FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV SERVE_STATIC=false

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["npm", "start"]

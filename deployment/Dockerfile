FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY core ./core
COPY memory ./memory
COPY vault ./vault
COPY api ./api

# /memory and /vault are meant to be bind-mounted from the host so data
# survives container rebuilds and never lives only inside the image.
VOLUME ["/app/memory", "/app/vault"]

EXPOSE 4000
CMD ["node", "api/server.js"]

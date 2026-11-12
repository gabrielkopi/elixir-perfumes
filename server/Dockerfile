FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src ./src
COPY migrations ./migrations
USER node
EXPOSE 8787
# A API escuta só dentro do container; o Nginx do servidor faz HTTPS e repassa /api.
ENV PORT=8787 HOST=0.0.0.0
CMD ["node", "src/index.js"]

FROM node:lts as dependencies
WORKDIR /pay-with-elusiv-backend
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:lts as builder
WORKDIR /pay-with-elusiv-backend
COPY . .
COPY --from=dependencies /pay-with-elusiv-backend/node_modules ./node_modules
RUN yarn build

FROM node:lts as runner
WORKDIR /pay-with-elusiv-backend
ENV NODE_ENV production
# If you are using a custom next.config.js file, uncomment this line.
# COPY --from=builder /pay-with-elusiv-backend/next.config.js ./
COPY --from=builder /pay-with-elusiv-backend/public ./public
COPY --from=builder /pay-with-elusiv-backend/.next ./.next
COPY --from=builder /pay-with-elusiv-backend/node_modules ./node_modules
COPY --from=builder /pay-with-elusiv-backend/package.json ./package.json

EXPOSE 3000
CMD ["yarn", "start"]

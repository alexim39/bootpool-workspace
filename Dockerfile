FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --project investbetz-platform --configuration production

FROM nginx:alpine
ENV API_URL=http://api:8383
COPY --from=builder /app/dist/investbetz-platform/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

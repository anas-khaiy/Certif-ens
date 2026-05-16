# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx (HTTPS-safe static files)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# SPA fallback: redirect all routes to index.html
RUN echo 'server { \
  listen 6175; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 6175
CMD ["nginx", "-g", "daemon off;"]

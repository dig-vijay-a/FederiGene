# FederiGene Frontend - Production Environment
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Use Nginx to serve the build
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing if needed
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

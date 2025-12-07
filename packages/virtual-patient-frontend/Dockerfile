# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 80

# Start development server with Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"] 
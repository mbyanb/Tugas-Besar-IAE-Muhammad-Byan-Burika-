FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (termasuk devDependencies seperti next)
RUN npm install

# Copy sisa kode
COPY . .

# Expose port
EXPOSE 3000

# Jalankan mode development
CMD ["npm", "run", "dev"]
# Sử dụng bản Node.js ổn định (LTS)
FROM node:18-alpine

# Tạo thư mục làm việc trong container
WORKDIR /app

# Chỉ copy file package trước để tối ưu cache khi build
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Mở cổng 3000 cho ứng dụng
EXPOSE 3000

# Lệnh khởi chạy ứng dụng
CMD ["node", "app.js"]

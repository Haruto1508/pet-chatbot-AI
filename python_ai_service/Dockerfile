# Sử dụng Python 3.10 phiên bản slim để tối ưu dung lượng (nhẹ hơn)
FROM python:3.10-slim

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Upgrade pip trước để tránh lỗi metadata wheels mới
RUN pip install --no-cache-dir --upgrade pip

# Copy danh sách thư viện vào trước (giúp cache lại các bước cài đặt)
COPY requirements.txt .

# 1. Cài đặt PyTorch CPU dùng --extra-index-url (để pip vẫn tìm thấy dependencies trên PyPI)
RUN pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu

# 2. Cài các thư viện còn lại trong requirements.txt
RUN grep -v "torch" requirements.txt > req_no_torch.txt && \
    pip install --no-cache-dir -r req_no_torch.txt

# Copy toàn bộ mã nguồn trong thư mục python_ai_service vào /app
COPY . .

# Mở port 8000 (cổng mặc định của ứng dụng)
EXPOSE 8000

# Lệnh khởi chạy server FastAPI khi container chạy
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

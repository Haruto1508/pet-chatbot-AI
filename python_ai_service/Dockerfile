# Sử dụng Python 3.10 phiên bản slim để tối ưu dung lượng (nhẹ hơn)
FROM python:3.10-slim

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Copy danh sách thư viện vào trước (giúp cache lại các bước cài đặt)
COPY requirements.txt .

# 1. Cài đặt PyTorch phiên bản CPU (RẤT QUAN TRỌNG khi deploy lên Cloud giá rẻ/miễn phí)
# Nếu cài bản PyTorch có GPU mặc định sẽ nặng > 2.5GB (gây quá tải server và lâu)
# Bản CPU chỉ khoảng ~200MB
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 2. Cài các thư viện còn lại trong requirements.txt
# (đã lọc bỏ torch và torchvision ra khỏi bước này do đã cài ở trên)
RUN grep -v "torch" requirements.txt > req_no_torch.txt && \
    pip install --no-cache-dir -r req_no_torch.txt

# Copy toàn bộ mã nguồn trong thư mục python_ai_service vào /app
COPY . .

# Mở port 8000 (cổng mặc định của ứng dụng)
EXPOSE 8000

# Lệnh khởi chạy server FastAPI khi container chạy
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# --- CẤU HÌNH ---
DATA_DIR = 'dataset/train'  # Thư mục chứa data, mỗi bệnh là 1 thư mục con (ví dụ: dataset/train/nam_da)
MODEL_SAVE_PATH = 'best_model.pth'
CLASSES_SAVE_PATH = 'classes.json'
BATCH_SIZE = 8  # Tùy chỉnh theo RAM/VRAM của máy
NUM_EPOCHS = 10 # Số vòng lặp huấn luyện

def main():
    print("--- BẮT ĐẦU QUÁ TRÌNH TRAINING MÔ HÌNH NHẬN DIỆN BỆNH ---")

    # Kiểm tra xem có thư mục data không
    if not os.path.exists(DATA_DIR) or len(os.listdir(DATA_DIR)) == 0:
        print(f"[LỖI] Không tìm thấy dữ liệu trong '{DATA_DIR}'.")
        print("Vui lòng bỏ hình ảnh vào các thư mục tương ứng (ví dụ: dataset/train/nam_da) trước khi chạy.")
        return

    # 1. Tiền xử lý (Augmentation) ảnh để mô hình học tốt hơn
    data_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(224), # Cắt ngẫu nhiên
        transforms.RandomHorizontalFlip(), # Lật ảnh ngang ngẫu nhiên
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # 2. Load Dữ liệu
    print("Đang tải dữ liệu hình ảnh...")
    image_dataset = datasets.ImageFolder(DATA_DIR, data_transforms)
    dataloader = torch.utils.data.DataLoader(image_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    
    class_names = image_dataset.classes
    num_classes = len(class_names)
    
    print(f"Phát hiện {num_classes} loại bệnh: {class_names}")
    print(f"Tổng số lượng ảnh: {len(image_dataset)}")

    # Lưu lại danh sách tên bệnh ra file JSON để lúc chạy web (main.py) biết cách đọc
    with open(CLASSES_SAVE_PATH, 'w', encoding='utf-8') as f:
        json.dump(class_names, f, ensure_ascii=False)

    # 3. Khởi tạo Mô hình (ResNet50)
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Đang sử dụng thiết bị tính toán: {device}")

    # Load pretrained ResNet50
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    
    # (Tùy chọn) Đóng băng các lớp ẩn để train nhanh hơn, chỉ train lớp cuối
    # for param in model.parameters():
    #     param.requires_grad = False

    # Thay đổi lớp cuối cùng (fc) cho phù hợp với số lượng bệnh của chúng ta
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)

    model = model.to(device)

    # 4. Định nghĩa hàm Loss và Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # 5. Bắt đầu Vòng lặp Training (Epochs)
    print("Bắt đầu huấn luyện...")
    for epoch in range(NUM_EPOCHS):
        print(f"Epoch {epoch+1}/{NUM_EPOCHS}")
        print("-" * 10)
        
        model.train()  # Đặt mô hình ở chế độ training
        
        running_loss = 0.0
        running_corrects = 0

        # Lặp qua từng batch ảnh
        for inputs, labels in dataloader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            # Reset gradient
            optimizer.zero_grad()

            # Forward (Lan truyền tiến)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)

            # Backward (Lan truyền ngược) + Optimize
            loss.backward()
            optimizer.step()

            # Thống kê
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        epoch_loss = running_loss / len(image_dataset)
        epoch_acc = running_corrects.double() / len(image_dataset)

        print(f"Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

    print("Huấn luyện hoàn tất!")

    # 6. Lưu Mô hình (Weights)
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"Đã lưu mô hình thành công tại: {MODEL_SAVE_PATH}")
    print(f"Đã lưu tên các bệnh tại: {CLASSES_SAVE_PATH}")
    print("Bây giờ bạn có thể khởi động lại server 'main.py' để bắt đầu sử dụng AI xịn do chính bạn train!")

if __name__ == '__main__':
    main()

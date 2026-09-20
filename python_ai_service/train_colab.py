# ============================================================
# Vethic AI - ResNet50 Training Script
# Kaggle: chạy trực tiếp trong Kaggle Notebook (T4 GPU miễn phí)
# Colab:  upload dataset lên Drive rồi mount
# ============================================================

# ---- CELL 1: Cài đặt thư viện ----
# !pip install torch torchvision tqdm matplotlib scikit-learn seaborn -q

# ---- CELL 2: Setup & Kiểm tra GPU ----
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
from torch.optim.lr_scheduler import ReduceLROnPlateau
import os, time, json, shutil
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from tqdm import tqdm

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"✅ Thiết bị: {device}")
if torch.cuda.is_available():
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

# ============================================================
# CELL 3: Download Dataset từ Kaggle
# ============================================================
# Trước khi chạy:
# 1. Vào https://www.kaggle.com/settings → API → "Create New Token"
# 2. Download kaggle.json → Upload lên Colab
#
# from google.colab import files
# uploaded = files.upload()  # chọn kaggle.json
#
# import os, shutil
# os.makedirs('/root/.kaggle', exist_ok=True)
# shutil.copy('kaggle.json', '/root/.kaggle/kaggle.json')
# os.chmod('/root/.kaggle/kaggle.json', 0o600)
#
# Download dataset (6 class khớp classes.txt):
# !kaggle datasets download -d scabiesdetection/dog-skin-disease -p ./dataset --unzip
#
# Nếu không có Kaggle account, mount Google Drive:
# from google.colab import drive
# drive.mount('/content/drive')
# DATASET_DIR = '/content/drive/MyDrive/pet_dataset/archive'

# ============================================================
# CELL 4: Cấu hình Training
# ============================================================
MODEL_SAVE   = "best_model.pth"   # Kaggle notebook lưu tên này
CLASSES_SAVE = "classes.txt"
BATCH_SIZE   = 16
EPOCHS       = 20
LR           = 1e-3
PATIENCE     = 5
IMG_SIZE     = 224

# Class name → Tiếng Việt (khớp với classes.txt hiện tại)
CLASS_VI = {
    "Dermatitis":        "Viêm da",
    "Fungal_infections": "Nấm da",
    "Healthy":           "Khỏe mạnh",
    "Hypersensitivity":  "Dị ứng / Mẫn cảm",
    "demodicosis":       "Ghẻ Demodex",
    "ringworm":          "Nấm vòng (Ringworm)"
}

# ============================================================
# CELL 5: Data Augmentation & Loading
# ============================================================
data_transforms = {
    'train': transforms.Compose([
        transforms.RandomResizedCrop(IMG_SIZE, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.1),
    ]),
    'valid': transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]),
}

train_dir = os.path.join(DATASET_DIR, 'train')
valid_dir = os.path.join(DATASET_DIR, 'valid')

assert os.path.exists(train_dir), f"❌ Không tìm thấy: {train_dir}"
assert os.path.exists(valid_dir), f"❌ Không tìm thấy: {valid_dir}"

image_datasets = {
    'train': datasets.ImageFolder(train_dir, data_transforms['train']),
    'valid': datasets.ImageFolder(valid_dir, data_transforms['valid']),
}
dataloaders = {
    'train': DataLoader(image_datasets['train'], batch_size=BATCH_SIZE, shuffle=True,  num_workers=2, pin_memory=True),
    'valid': DataLoader(image_datasets['valid'], batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True),
}

class_names = image_datasets['train'].classes
num_classes  = len(class_names)

print(f"✅ Tìm thấy {num_classes} class:")
for c in class_names:
    print(f"   {c:25s} → {CLASS_VI.get(c, '⚠️ Chưa mapping')}")
print(f"\n   Train: {len(image_datasets['train'])} ảnh")
print(f"   Valid: {len(image_datasets['valid'])} ảnh")

# ============================================================
# CELL 6: Khởi tạo Model ResNet50 (mạnh hơn ResNet18)
# ============================================================
print("\n🔧 Đang khởi tạo ResNet50 pretrained...")
model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)

# Thay lớp fc cuối (simple fc | dễ load trong main.py)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, num_classes)
model = model.to(device)
print(f"✅ ResNet50 sẵn sàng → {num_classes} output classes")

# ============================================================
# CELL 7: Training Loop với Early Stopping
# ============================================================
criterion = nn.CrossEntropyLoss()
optimizer = optim.SGD(model.parameters(), lr=LR, momentum=0.9)
scheduler = ReduceLROnPlateau(optimizer, mode='max', patience=2, factor=0.5, verbose=True)

def train_one_epoch(model, dataloader, optimizer, is_train):
    model.train() if is_train else model.eval()
    total_loss, total_correct = 0.0, 0
    for inputs, labels in tqdm(dataloader, desc="Train" if is_train else "Valid", leave=False):
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        with torch.set_grad_enabled(is_train):
            outputs = model(inputs)
            loss    = criterion(outputs, labels)
            preds   = outputs.argmax(dim=1)
            if is_train:
                loss.backward()
                optimizer.step()
        total_loss    += loss.item() * inputs.size(0)
        total_correct += (preds == labels).sum().item()
    n = len(dataloader.dataset)
    return total_loss / n, total_correct / n

best_acc    = 0.0
patience_ct = 0
history     = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}

print("\n🚀 Bắt đầu training...\n")
start = time.time()

for epoch in range(EPOCHS):
    # Epoch 5: Unfreeze toàn bộ backbone (fine-tune)
    # ResNet50 không freeze nên không cần bước này
    t_loss, t_acc = train_one_epoch(model, dataloaders['train'], optimizer, is_train=True)
    v_loss, v_acc = train_one_epoch(model, dataloaders['valid'], optimizer, is_train=False)

    scheduler.step(v_acc)
    history['train_loss'].append(t_loss)
    history['val_loss'].append(v_loss)
    history['train_acc'].append(t_acc)
    history['val_acc'].append(v_acc)

    saved = ""
    if v_acc > best_acc:
        best_acc    = v_acc
        patience_ct = 0
        torch.save(model.state_dict(), MODEL_SAVE)
        saved = " ✅ Saved!"
    else:
        patience_ct += 1
        if patience_ct >= PATIENCE:
            print(f"⏹️  Early stopping tại epoch {epoch+1}")
            break

    print(f"Epoch {epoch+1:02d}/{EPOCHS} | "
          f"Train: loss={t_loss:.4f} acc={t_acc:.2%} | "
          f"Valid: loss={v_loss:.4f} acc={v_acc:.2%}{saved}")

elapsed = time.time() - start
print(f"\n🎉 Training xong! Thời gian: {elapsed//60:.0f}m {elapsed%60:.0f}s")
print(f"   Best validation accuracy: {best_acc:.2%}")

# ============================================================
# CELL 8: Lưu classes.txt + class_vi_mapping.json
# ============================================================
with open(CLASSES_SAVE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(class_names))

with open('class_vi_mapping.json', 'w', encoding='utf-8') as f:
    json.dump({c: CLASS_VI.get(c, c) for c in class_names}, f, ensure_ascii=False, indent=2)

print(f"✅ Đã lưu: {MODEL_SAVE} | {CLASSES_SAVE} | class_vi_mapping.json")

# ============================================================
# CELL 9: Đánh giá trên Test Set (nếu có)
# ============================================================
if 'test' in dataloaders:
    from sklearn.metrics import classification_report, confusion_matrix
    import seaborn as sns

    model.load_state_dict(torch.load(MODEL_SAVE, map_location=device))
    model.eval()
    y_true, y_pred = [], []
    with torch.no_grad():
        for inputs, labels in tqdm(dataloaders['test'], desc='Test'):
            outputs = model(inputs.to(device))
            preds   = outputs.argmax(dim=1)
            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())

    print("\n📊 Classification Report:")
    print(classification_report(y_true, y_pred, target_names=class_names))

    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title('Confusion Matrix'); plt.tight_layout()
    plt.savefig('confusion_matrix.png', dpi=150)
    plt.show()

# ============================================================
# CELL 9: Vẽ đồ thị
# ============================================================
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
axes[0].plot(history['train_loss'], label='Train Loss')
axes[0].plot(history['val_loss'],   label='Valid Loss')
axes[0].set_title('Loss Curve'); axes[0].legend(); axes[0].grid(True)

axes[1].plot(history['train_acc'], label='Train Acc')
axes[1].plot(history['val_acc'],   label='Valid Acc')
axes[1].set_title('Accuracy Curve'); axes[1].legend(); axes[1].grid(True)
plt.tight_layout()
plt.savefig('training_history.png', dpi=150)
plt.show()

# ============================================================
# CELL 10: Download về máy tính
# ============================================================
# from google.colab import files
# files.download('disease_model.pth')       # ~44MB
# files.download('classes.txt')
# files.download('class_vi_mapping.json')
# files.download('training_history.png')

# Hoặc copy lên Google Drive:
# shutil.copy('disease_model.pth', '/content/drive/MyDrive/petcare_ai/disease_model.pth')

print("""
╔══════════════════════════════════════════════════╗
║  XONG! Bước tiếp theo:                          ║
║  1. Download disease_model.pth (~44MB)           ║
║  2. Download classes.txt                         ║
║  3. Đặt vào thư mục: python_ai_service/          ║
║  4. Git LFS: git lfs track "*.pth"               ║
║  5. git add + commit + push → Render redeploy    ║
╚══════════════════════════════════════════════════╝
""")

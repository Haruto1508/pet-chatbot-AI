import os
import sys
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
from torch.optim.lr_scheduler import ReduceLROnPlateau
from tqdm import tqdm

# Dam bao in khong loi Unicode tren Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=" * 60)
    print("    PETCARE AI - HUAN LUYEN MODEL RESNET50 (LOCAL GPU)")
    print("=" * 60)

    # 1. Kiem tra thiet bi (GPU)
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f">> Thiet bi su dung: {device}")
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f">> GPU: {gpu_name} ({vram_gb:.1f} GB VRAM)")
    else:
        print(">> CANH BAO: Khong tim thay GPU CUDA! Se chay tren CPU (cham hon).")

    # 2. Duong dan thu muc
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(script_dir, "dataset")
    train_dir = os.path.join(dataset_dir, "train")
    valid_dir = os.path.join(dataset_dir, "valid")
    classes_file = os.path.join(script_dir, "classes.txt")
    mapping_file = os.path.join(script_dir, "class_vi_mapping.json")

    best_model_path = os.path.join(script_dir, "best_model.pth")
    disease_model_path = os.path.join(script_dir, "disease_model.pth")

    if not os.path.exists(train_dir) or not os.path.exists(valid_dir):
        print(f">> LOI: Khong tim thay thu muc dataset train/valid tai: {dataset_dir}")
        print(">> Vui long chay prepare_dataset.py truoc!")
        return

    # Load Vietnamese mapping de in thong tin dep mat
    vi_mapping = {}
    if os.path.exists(mapping_file):
        with open(mapping_file, "r", encoding="utf-8") as f:
            vi_mapping = json.load(f)

    # 3. Data transforms
    IMG_SIZE = 224
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(IMG_SIZE, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(p=0.2),
            transforms.RandomRotation(25),
            transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.25),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]),
        'valid': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(IMG_SIZE),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]),
    }

    # 4. DataLoader
    BATCH_SIZE = 16  # Toi uu cho RTX 3050 6GB
    NUM_WORKERS = 0  # Tren Windows, num_workers=0 on dinh nhat de tranh loi multiprocessing

    train_dataset = datasets.ImageFolder(train_dir, data_transforms['train'])
    valid_dataset = datasets.ImageFolder(valid_dir, data_transforms['valid'])

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS, pin_memory=True)
    valid_loader = DataLoader(valid_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS, pin_memory=True)

    class_names = train_dataset.classes
    num_classes = len(class_names)

    print(f"\n>> Phat hien {num_classes} lop benh:")
    for i, c in enumerate(class_names):
        print(f"   [{i}] {c} -> {vi_mapping.get(c, c)}")

    print(f">> So luong anh Train: {len(train_dataset)}")
    print(f">> So luong anh Valid: {len(valid_dataset)}")

    # 5. Khoi tao Model ResNet50 Pretrained
    print("\n>> Dang khoi tao ResNet50 (Pretrained ImageNet)...")
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)  # Khop cau truc voi main.py
    model = model.to(device)

    # 6. Loss & Optimizer & Scheduler
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    EPOCHS = 15
    best_acc = 0.0
    best_epoch = 0

    print(f"\n>> BAT DAU HUAN LUYEN: {EPOCHS} Epochs (Batch size = {BATCH_SIZE})...\n")
    start_train_time = time.time()

    for epoch in range(EPOCHS):
        epoch_start = time.time()
        print(f"--- Epoch {epoch + 1}/{EPOCHS} ---")

        # --- Phase Train ---
        model.train()
        train_loss = 0.0
        train_corrects = 0

        for inputs, labels in tqdm(train_loader, desc=f"Train Epoch {epoch+1}"):
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)

            loss.backward()
            optimizer.step()

            train_loss += loss.item() * inputs.size(0)
            train_corrects += torch.sum(preds == labels.data).item()

        epoch_train_loss = train_loss / len(train_dataset)
        epoch_train_acc = train_corrects / len(train_dataset)

        # --- Phase Valid ---
        model.eval()
        val_loss = 0.0
        val_corrects = 0

        with torch.no_grad():
            for inputs, labels in tqdm(valid_loader, desc=f"Val   Epoch {epoch+1}"):
                inputs = inputs.to(device)
                labels = labels.to(device)

                outputs = model(inputs)
                loss = criterion(outputs, labels)
                _, preds = torch.max(outputs, 1)

                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data).item()

        epoch_val_loss = val_loss / len(valid_dataset)
        epoch_val_acc = val_corrects / len(valid_dataset)
        elapsed = time.time() - epoch_start

        current_lr = optimizer.param_groups[0]['lr']
        scheduler.step(epoch_val_loss)

        print(f"Epoch {epoch+1:02d} ({elapsed:.1f}s) | "
              f"Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc*100:.2f}% | "
              f"Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc*100:.2f}% | "
              f"LR: {current_lr:.6f}")

        # Luu model tot nhat
        if epoch_val_acc > best_acc:
            best_acc = epoch_val_acc
            best_epoch = epoch + 1
            torch.save(model.state_dict(), best_model_path)
            torch.save(model.state_dict(), disease_model_path)
            print(f"   --> [BEST] Da luu model voi Val Acc ky luc: {best_acc*100:.2f}%\n")
        else:
            print()

    total_time = time.time() - start_train_time
    print("=" * 60)
    print(f">> HUAN LUYEN HOAN TAT trong {total_time/60:.1f} phut!")
    print(f">> Do chinh xac cao nhat (Val Acc): {best_acc*100:.2f}% o Epoch {best_epoch}")
    print(f">> Model da duoc luu tai:")
    print(f"   - {best_model_path}")
    print(f"   - {disease_model_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()

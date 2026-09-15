import os
import sys
import shutil
import random
import json

# Dam bao in khong bi loi tren Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

SOURCE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Dogs"))
DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "dataset"))
CLASSES_TXT = os.path.abspath(os.path.join(os.path.dirname(__file__), "classes.txt"))
CLASS_VI_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), "class_vi_mapping.json"))

CLASS_VI_MAPPING = {
    "Bacterial_dermatosis": "Viêm da do vi khuẩn",
    "Fungal_infections": "Nấm da",
    "Healthy": "Khỏe mạnh",
    "Hypersensitivity_allergic_dermatosis": "Viêm da dị ứng / Mẫn cảm"
}

def prepare():
    if not os.path.exists(SOURCE_DIR):
        print(f"[ERROR] Khong tim thay thu muc: {SOURCE_DIR}")
        return

    print(f"[INFO] Dang quet thu muc nguon: {SOURCE_DIR}")
    classes = sorted([d for d in os.listdir(SOURCE_DIR) if os.path.isdir(os.path.join(SOURCE_DIR, d))])
    print(f"[OK] Phat hien {len(classes)} lop benh: {classes}")

    train_dir = os.path.join(DATASET_DIR, "train")
    valid_dir = os.path.join(DATASET_DIR, "valid")

    if os.path.exists(DATASET_DIR):
        shutil.rmtree(DATASET_DIR)
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(valid_dir, exist_ok=True)

    total_train = 0
    total_valid = 0

    random.seed(42)

    print("\n--- BAT DAU CHIA TAP TRAIN (80%) VA VALID (20%) ---")
    for cls in classes:
        src_cls_dir = os.path.join(SOURCE_DIR, cls)
        train_cls_dir = os.path.join(train_dir, cls)
        valid_cls_dir = os.path.join(valid_dir, cls)

        os.makedirs(train_cls_dir, exist_ok=True)
        os.makedirs(valid_cls_dir, exist_ok=True)

        valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.bmp')
        images = [f for f in os.listdir(src_cls_dir) if f.lower().endswith(valid_extensions)]
        random.shuffle(images)

        split_idx = int(len(images) * 0.8)
        train_imgs = images[:split_idx]
        valid_imgs = images[split_idx:]

        for img in train_imgs:
            shutil.copy2(os.path.join(src_cls_dir, img), os.path.join(train_cls_dir, img))

        for img in valid_imgs:
            shutil.copy2(os.path.join(src_cls_dir, img), os.path.join(valid_cls_dir, img))

        vi_name = CLASS_VI_MAPPING.get(cls, cls)
        print(f"- {cls} ({vi_name}): Tong {len(images)} anh -> Train: {len(train_imgs)}, Valid: {len(valid_imgs)}")
        total_train += len(train_imgs)
        total_valid += len(valid_imgs)

    with open(CLASSES_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(classes))
    print(f"\n[OK] Da luu danh sach class vao: {CLASSES_TXT}")

    with open(CLASS_VI_JSON, "w", encoding="utf-8") as f:
        json.dump(CLASS_VI_MAPPING, f, ensure_ascii=False, indent=2)
    print(f"[OK] Da luu Vietnamese mapping vao: {CLASS_VI_JSON}")

    print(f"\n[HOAN TAT] Tong anh Train: {total_train}, Tong anh Valid: {total_valid}")

if __name__ == "__main__":
    prepare()

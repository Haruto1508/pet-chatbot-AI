from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import json
import os
from io import BytesIO
from PIL import Image
import torch
from torchvision import models, transforms
import torch.nn as nn

app = FastAPI(title="PetCare AI - ResNet Image Classification API")

# --- CẤU HÌNH ---
MODEL_PATH       = os.getenv('MODEL_PATH', 'disease_model.pth')
CLASSES_PATH     = os.getenv('CLASSES_PATH', 'classes.txt')
CLASS_VI_PATH    = 'class_vi_mapping.json'
CONFIDENCE_HIGH  = 70.0   # Ngưỡng tin cậy cao (%)

# Preprocessing transforms expected by ResNet
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# --- LOAD MODEL ---
print("Đang khởi tạo Hệ thống Trí tuệ Nhân tạo...")

# Load Vietnamese class mapping nếu có
class_vi_mapping: dict = {}
if os.path.exists(CLASS_VI_PATH):
    with open(CLASS_VI_PATH, 'r', encoding='utf-8') as f:
        class_vi_mapping = json.load(f)
    print(f">> Đã load Vietnamese mapping: {list(class_vi_mapping.keys())}")

is_mock = True
model   = None
my_classes: list = []

if os.path.exists(MODEL_PATH) and os.path.exists(CLASSES_PATH):
    print(f">> Phát hiện model đã train ({MODEL_PATH})! Đang tải...")
    with open(CLASSES_PATH, 'r', encoding='utf-8') as f:
        my_classes = f.read().splitlines()

    num_classes = len(my_classes)

    # Thử ResNet50 trước (Kaggle notebook dùng ResNet50 + simple fc)
    loaded = False
    for arch_name, arch_fn in [('resnet50', models.resnet50), ('resnet18', models.resnet18)]:
        try:
            m = arch_fn()
            num_ftrs = m.fc.in_features
            m.fc = nn.Linear(num_ftrs, num_classes)  # Simple fc (khớp train_colab.py)
            m.load_state_dict(torch.load(MODEL_PATH, map_location=device))
            model = m
            loaded = True
            print(f">> Tải thành công với {arch_name}! Sẵn sàng chẩn đoán {num_classes} loại bệnh.")
            break
        except Exception:
            continue

    if loaded:
        model = model.to(device)
        model.eval()
        is_mock = False
        print(f">> Tải thành công! Sẵn sàng chẩn đoán {num_classes} loại bệnh: {my_classes}")
    else:
        print(">> [LỖI] Không thể load model. Chuyển sang chế độ Mock.")
        weights    = models.ResNet18_Weights.DEFAULT
        model      = models.resnet18(weights=weights)
        model      = model.to(device)
        model.eval()
        is_mock    = True
        my_classes = ["Bacterial_dermatosis", "Fungal_infections", "Healthy", "Hypersensitivity_allergic_dermatosis"]
else:
    print(">> [CẢNH BÁO] Không tìm thấy disease_model.pth → Khởi động chế độ Mock.")
    print(">>  Hãy train model và deploy để có kết quả thật.")
    weights    = models.ResNet18_Weights.DEFAULT
    model      = models.resnet18(weights=weights)
    model      = model.to(device)
    model.eval()
    my_classes = ["Dermatitis", "Fungal_infections", "Healthy",
                  "Hypersensitivity", "demodicosis", "ringworm"]
    # Build default Vietnamese mapping for mock mode
    class_vi_mapping = {
        "Dermatitis":        "Viêm da",
        "Fungal_infections": "Nấm da",
        "Healthy":           "Khỏe mạnh",
        "Hypersensitivity":  "Dị ứng / Mẫn cảm",
        "demodicosis":       "Ghẻ Demodex",
        "ringworm":          "Nấm vòng (Ringworm)"
    }


# --- SCHEMAS ---
class ImageRequest(BaseModel):
    image_base64: str


# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "PetCare ResNet API is running."}


@app.get("/health")
def health():
    """Kiểm tra trạng thái model đang chạy."""
    return {
        "status":      "ok",
        "is_mock":     is_mock,
        "model_path":  MODEL_PATH if not is_mock else None,
        "num_classes": len(my_classes),
        "classes":     my_classes,
        "device":      str(device),
        "confidence_threshold_high": CONFIDENCE_HIGH
    }


@app.post("/predict")
async def predict_image(request: ImageRequest):
    try:
        # 1. Decode base64 → PIL Image
        image_data = request.image_base64
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]

        img_bytes = base64.b64decode(image_data)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")

        # 2. Preprocess
        input_tensor = preprocess(img)
        input_batch  = input_tensor.unsqueeze(0).to(device)

        # 3. Inference
        with torch.no_grad():
            output = model(input_batch)

        probabilities = torch.nn.functional.softmax(output[0], dim=0)

        # 4. Top-1 prediction
        confidence_val, class_idx = torch.max(probabilities, 0)
        top1_idx  = class_idx.item()
        top1_conf = round(confidence_val.item() * 100, 2)

        if not is_mock:
            top1_class = my_classes[top1_idx]
        else:
            # Mock: map ImageNet index vào mock classes
            top1_class = my_classes[top1_idx % len(my_classes)]
            top1_conf  = round(float(probabilities[top1_idx % len(probabilities)].item() * 100), 2)

        top1_class_vi = class_vi_mapping.get(top1_class, top1_class)

        # 5. Top-3 predictions
        k = min(3, len(my_classes))
        top3_probs, top3_indices = torch.topk(probabilities, k)
        top3 = []
        for prob, idx in zip(top3_probs, top3_indices):
            if not is_mock:
                cname = my_classes[idx.item()]
            else:
                cname = my_classes[idx.item() % len(my_classes)]
            top3.append({
                "class_name":    cname,
                "class_name_vi": class_vi_mapping.get(cname, cname),
                "confidence":    round(prob.item() * 100, 2)
            })

        return {
            "success": True,
            "is_mock": is_mock,
            "prediction": {
                "class_name":    top1_class,
                "class_name_vi": top1_class_vi,
                "confidence":    top1_conf,
                "is_high_confidence": top1_conf >= CONFIDENCE_HIGH and not is_mock,
                "top3": top3
            },
            "message": f"{'[MOCK] ' if is_mock else ''}Chẩn đoán: {top1_class_vi} ({top1_conf}%)"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

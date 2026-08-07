from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
import torch
from torchvision import models, transforms
import json
import os

app = FastAPI(title="PetCare AI - ResNet Image Classification API")

# --- CẤU HÌNH ---
MODEL_PATH = 'disease_model.pth'
CLASSES_PATH = 'classes.txt'

print("Đang khởi tạo Hệ thống Trí tuệ Nhân tạo...")

# Preprocessing transforms expected by ResNet
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# Kiểm tra xem đã có model tự train chưa
if os.path.exists(MODEL_PATH) and os.path.exists(CLASSES_PATH):
    print(">> Phát hiện bộ trọng số đã huấn luyện (disease_model.pth)! Đang tải lên...")
    with open(CLASSES_PATH, 'r', encoding='utf-8') as f:
        my_classes = f.read().splitlines()
    
    num_classes = len(my_classes)
    model = models.resnet18()
    model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model = model.to(device)
    model.eval()
    is_mock = False
    print(f">> Tải thành công! Sẵn sàng chẩn đoán {num_classes} loại bệnh: {my_classes}")
else:
    print(">> [CẢNH BÁO] Không tìm thấy file disease_model.pth.")
    print(">> Hệ thống sẽ khởi động ở chế độ [Mockup/Giả lập] bằng ResNet18 gốc (Nhận diện chó/mèo chung chung).")
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    model = model.to(device)
    model.eval()
    my_classes = ["Nấm da (Ringworm)", "Viêm da mủ (Pyoderma)", "Khỏe mạnh"] # Giả lập
    is_mock = True

class ImageRequest(BaseModel):
    image_base64: str

@app.get("/")
def read_root():
    return {"message": "PetCare ResNet API is running."}

@app.post("/predict")
async def predict_image(request: ImageRequest):
    try:
        # 1. Decode base64 string to Image
        image_data = request.image_base64
        # Remove data URI prefix if present
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
            
        img_bytes = base64.b64decode(image_data)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        
        # 2. Preprocess
        input_tensor = preprocess(img)
        input_batch = input_tensor.unsqueeze(0).to(device)
        
        # 3. Inference
        with torch.no_grad():
            output = model(input_batch)
            
        # 4. Get top prediction
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, class_idx = torch.max(probabilities, 0)
        
        confidence_val = confidence.item()
        
        if not is_mock:
            # Model xịn: Trả về tên class tương ứng
            predicted_disease = my_classes[class_idx.item()]
        else:
            # Chế độ giả lập: Tự động random tên bệnh từ danh sách mock_classes
            predicted_disease = my_classes[class_idx.item() % len(my_classes)]
        
        return {
            "success": True,
            "prediction": {
                "class_name": predicted_disease,
                "confidence": round(confidence_val * 100, 2),
                "raw_class_idx": class_idx.item()
            },
            "message": f"Hệ thống nhận diện đây là {predicted_disease} với độ tin cậy {round(confidence_val * 100, 2)}%"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

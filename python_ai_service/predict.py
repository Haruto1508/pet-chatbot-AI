import argparse
import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# Configurations
MODEL_SAVE_PATH = "disease_model.pth"
CLASSES_FILE = "classes.txt"

def predict(image_path):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Load classes
    if not os.path.exists(CLASSES_FILE):
        print(f"Error: {CLASSES_FILE} not found. Did you run train_model.py first?")
        return
    with open(CLASSES_FILE, "r") as f:
        class_names = f.read().splitlines()
    num_classes = len(class_names)

    # Setup Model
    model = models.resnet18(weights=None)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    
    # Load weights
    if not os.path.exists(MODEL_SAVE_PATH):
        print(f"Error: {MODEL_SAVE_PATH} not found. Please train the model first.")
        return
        
    model.load_state_dict(torch.load(MODEL_SAVE_PATH, map_location=device))
    model = model.to(device)
    model.eval()

    # Image transform (same as valid transform)
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load and preprocess image
    try:
        image = Image.open(image_path).convert('RGB')
    except Exception as e:
        print(f"Error loading image: {e}")
        return

    input_tensor = transform(image)
    input_batch = input_tensor.unsqueeze(0).to(device) # create a mini-batch as expected by the model

    with torch.no_grad():
        outputs = model(input_batch)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, predicted_idx = torch.max(probabilities, 0)
        
    predicted_class = class_names[predicted_idx.item()]
    
    print(f"\n--- Prediction Results ---")
    print(f"Image: {image_path}")
    print(f"Predicted Disease: {predicted_class}")
    print(f"Confidence: {confidence.item() * 100:.2f}%")
    print("--------------------------\n")
    
    # Print all probabilities
    print("All Probabilities:")
    for i, cls in enumerate(class_names):
        print(f"- {cls}: {probabilities[i].item() * 100:.2f}%")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Predict dog skin disease from an image.')
    parser.add_argument('image_path', type=str, help='Path to the image file')
    args = parser.parse_args()
    
    predict(args.image_path)

import urllib.request
import os

print("--- DOWNLOADING SAMPLE IMAGES ---")

dirs = {
    'nam_da': 'https://placehold.co/224x224/red/white.png?text=Nam+Da',
    'viem_da': 'https://placehold.co/224x224/blue/white.png?text=Viem+Da',
    'khoe_manh': 'https://placehold.co/224x224/green/white.png?text=Khoe+Manh'
}

base_dir = 'python_ai_service/dataset/train'

for folder_name, img_url in dirs.items():
    folder_path = os.path.join(base_dir, folder_name)
    os.makedirs(folder_path, exist_ok=True)
    
    # Tải 3 bức ảnh cho mỗi loại bệnh
    for i in range(1, 4):
        file_path = os.path.join(folder_path, f'sample_{i}.png')
        try:
            req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(file_path, 'wb') as out_file:
                out_file.write(response.read())
            print(f"[+] Downloaded: {folder_name}/sample_{i}.png")
        except Exception as e:
            print(f"[-] Error downloading: {e}")

print("--- DOWNLOAD COMPLETE! YOU CAN RUN 'py train.py' NOW ---")

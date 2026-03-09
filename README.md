# StepSecure: Intelligent Surveillance & Identity Dashboard

StepSecure is a real-time smart dashboard for monitoring RTSP cameras, tracking events, and identifying individuals using edge-based computer vision.

![Dashboard Overview](public/vite.svg) *Wait for your actual screenshot!*

---

## 🚀 How to Run the Website

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.9+)
3. **mediamtx** (A free, single-binary RTSP-to-HLS proxy) Download: [bluenviron/mediamtx](https://github.com/bluenviron/mediamtx/releases)

### Setup Instructions

**1. Clone the repository**
```bash
git clone https://github.com/Farox008/StepSecure.git
cd StepSecure
```

**2. Install Frontend & Node Server Dependencies**
```bash
npm install
```

**3. Install Python AI Dependencies**
The first time the node server boots, it will attempt to install the Python dependencies automatically. If it fails due to permissions, open a terminal in the folder and run:
```bash
python -m pip install -r model_server/requirements.txt
```

**4. Start the Application**
```bash
npm run dev
```
This single command uses `concurrently` to launch both the React/Vite development server (Port `5173`) and the Node/Python Proxy and ML Model Server (Port `3001` and `8001`).

**5. Start the Live RTSP Proxy (Optional, for Live Video)**
To see live video instead of static images, drop `mediamtx.exe` into the root of this folder and double-click it. The frontend will immediately use it to covert standard IP camera RTSP feeds into browser-playable HLS streams.

---

## 🧠 How the Machine Learning Pipeline Works

The intelligence of StepSecure resides in a local FastAPI Python server located in `./model_server/main.py`. It runs completely on the "edge" (your local PC), ensuring privacy and saving cloud costs.

The pipeline comprises four key components:

### 1. Person Detection (YOLOv8)
The server uses the state-of-the-art **YOLOv8 nano** (`yolov8n.pt`) object detection model from Ultralytics.
- When an RTSP stream is being monitored or a video is being tested, YOLO scans every frame.
- It is specifically filtered to only look for `class=[0]` (Persons).
- It ignores vehicles, animals, and background motion, providing highly accurate bounding boxes.

### 2. Multi-Object Tracking (ByteTrack)
Because YOLO only finds boxes in a *single frame*, the system uses **ByteTrack**.
- ByteTrack assigns a persistent unique ID to every person it detects.
- It tracks that person as they walk entirely across the frame.
- **RTSP Monitoring Loop**: When a person is tracked for more than 30 consecutive frames, the system groups those frames into a "Clip" and sends it to the identity extractor.

### 3. Feature Extraction (OpenCV Color Histograms)
Once a person is isolated, the system needs to mathematically represent "who" they are to recognize them later.
- Instead of using heavy, slow deep learning models for facial recognition (which fail if faces are obscured or turned away), the system uses lightning-fast **OpenCV HSV Color Histograms**.
- It crops the bounding box of the person, resizes it to a fixed `64x128` grid, and converts it to HSV space (which is highly resistant to lighting/shadow changes).
- It calculates a 3D histogram (16 Hue bins, 8 Saturation bins, 10 Value bins), resulting in exactly `1280` values.
- These 1280 values represent the "fingerprint" of the person's clothing and appearance.

### 4. Identity Matching & Incremental Learning (FAISS)
The 1280-dimensional mathematical fingerprint is passed into **FAISS** (Facebook AI Similarity Search), an ultra-fast local vector database.

- **Registration Mode**: The user uploads X number of walking videos. The system extracts the histogram fingerprint from every single frame, mathematically averages them all together, and saves this master "Gallery Embedding" into the FAISS database.
- **Matching Mode**: When a new person is seen on camera, their fingerprint is extracted and compared to the FAISS database using `Cosine Similarity`. If the similarity is `>= 72%`, the system identifies them as "Known" (e.g., *Sarah Chen*). If it is lower, they are marked as an "Unknown Person" and a Security Alert is triggered!
- **Incremental Learning**: If a Known Person is detected with high confidence, the system takes 20% of their *new* appearance on camera today, and blends it into the 80% baseline stored in FAISS. This means the system slowly adapts to lighting changes dynamically over time!

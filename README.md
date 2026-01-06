# 🚶‍♂️ StepSecure

StepSecure is a real-time gait recognition system that identifies employees using CCTV footage by analyzing how they walk.  
It differentiates between employees and intruders in a contactless and non-intrusive way using gait patterns.

---

## 🔍 What It Does

- Processes CCTV or video input (MP4 / RTSP)
- Extracts human pose keypoints from video
- Uses a deep learning model (GaitNet) to generate gait embeddings
- Identifies employees based on walking patterns
- Flags unknown individuals as Intruders
- Displays results on a modern web dashboard

---

## ⚙️ Tech Stack

- Python
- OpenCV
- MediaPipe / OpenPose
- PyTorch (GaitNet)
- FastAPI
- PostgreSQL + pgvector (Supabase)
- React + Tailwind CSS

---

## 🚀 How It Works

1. Capture video from CCTV
2. Extract 33 body keypoints per frame
3. Convert walking motion into a 128-dimensional gait embedding
4. Compare the embedding with stored employee embeddings
5. Display result as Employee or Intruder

---

## ▶️ Quick Start

```bash
# Create virtual environment
python -m venv venv

# Activate environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the model
python train_gaitnet.py

# Run live recognition
python live_recognition.py

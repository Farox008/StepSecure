StepSecure

StepSecure is a gait-based employee identification system that works using CCTV video feeds.
It identifies people by the way they walk (gait) and determines whether they are an employee or an intruder.

The system uses pose estimation and deep learning to analyze walking patterns and shows results on a web dashboard.

What the Project Does

Uses CCTV or video input

Detects people and analyzes how they walk

Identifies employees using gait patterns

Labels unknown people as Intruder

Shows live alerts and logs on a website

How It Works (Simple)

CCTV video is captured

Body keypoints are extracted from each frame

GaitNet model converts walking motion into a 128-dimensional vector

The vector is compared with stored employee data

Result is shown as:

Employee name with confidence

OR Intruder alert

Dataset Structure

Each employee has multiple angles and videos:

dataset/
├── emp1/
│   ├── angle1/
│   │   ├── video1.mp4
│   │   ├── video2.mp4
│   ├── angle2/
│   │   ├── video1.mp4
│   │   ├── video2.mp4
├── emp2/
│   ├── angle1/
│   ├── angle2/

Technologies Used

Python

OpenCV

MediaPipe / OpenPose

PyTorch (GaitNet)

FastAPI

Supabase (PostgreSQL + pgvector)

React + Tailwind (Website)

Main Features

Live CCTV monitoring

Employee identification

Intruder detection

Confidence score display

Alert and event logging

Simple and modern dashboard

How to Run (Basic)

Create virtual environment

python -m venv venv


Activate environment

venv\Scripts\activate


Install dependencies

pip install -r requirements.txt


Train the model

python train_gaitnet.py


Run live recognition

python live_recognition.py

Project Goal

To build a non-intrusive, contactless, and real-time identification system using walking patterns instead of faces or physical authentication.

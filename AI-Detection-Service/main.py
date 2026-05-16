from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import io
from PIL import Image
import mediapipe as mp
try:
    mp_face_mesh = mp.solutions.face_mesh
    
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
except Exception as e:
    print(f"WARNING: MediaPipe could not be loaded: {e}. Head pose detection will be disabled.")
    face_mesh = None

app = FastAPI(title="CertiFlow AI Detection Service")


# Enable CORS for frontend accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
        "https://srv1674744.hstgr.cloud",
        "https://srv1674744.hstgr.cloud:5173",
        "https://srv1674744.hstgr.cloud:5174",
        "https://srv1674744.hstgr.cloud:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model (Nano version for speed)
model = YOLO("yolov8n.pt")

@app.get("/")
async def root():
    return {"message": "CertiFlow AI Detection Service is running"}

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    # Read the image from the uploaded file
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Perform detection with 30% threshold
    results = model(img, conf=0.30)
    
    detections = []
    # Comprehensive list with common variations
    forbidden_classes = [
        "cell phone", "phone", "smartphone", "laptop", "remote", 
        "book", "tablet", "monitor", "tv", "television", "notebook"
    ]
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls = int(box.cls[0])
            label = model.names[cls].lower().strip()
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            
            # Very aggressive check for forbidden objects
            is_triche = False
            for forbidden in forbidden_classes:
                if forbidden in label or label in forbidden:
                    is_triche = True
                    break
            
            # Force red for phone specifically if the check above missed it somehow
            if "phone" in label or "mobile" in label:
                is_triche = True
                
            color = "red" if is_triche else "blue"
            
            # CRITICAL LOG for the user to see what's happening
            status_icon = "❌ TRICHE" if is_triche else "✅ OK"
            print(f"[{status_icon}] Detected: '{label}' | Confidence: {conf:.2f} | Color assigned: {color.upper()}")
            
            detections.append({
                "class": label,
                "confidence": conf,
                "bbox": xyxy,
                "is_triche": is_triche,
                "color": color
            })

    # --- MediaPipe Head Pose Estimation ---
    looking_away = False
    if face_mesh is not None:
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_results = face_mesh.process(rgb_img)
        
        if face_results.multi_face_landmarks:
            for face_landmarks in face_results.multi_face_landmarks:
                # Nose tip (4), Left eye inner corner (133), Right eye inner corner (362)
                # We use a simple ratio-based approach for yaw (turning head)
                nose_tip = face_landmarks.landmark[4]
                left_eye = face_landmarks.landmark[33]
                right_eye = face_landmarks.landmark[263]
                
                # Distance from nose to left/right eye to detect head turn (Yaw)
                dist_left = abs(nose_tip.x - left_eye.x)
                dist_right = abs(nose_tip.x - right_eye.x)
                
                # Ratio shows if head is centered or turned
                if dist_right > 0 and dist_left > 0:
                    ratio = dist_left / dist_right
                    # Thresholds for looking away left/right
                    if ratio > 2.5 or ratio < 0.4:
                        looking_away = True
                
                # Pitch detection (Looking up/down)
                avg_eye_y = (left_eye.y + right_eye.y) / 2
                # If nose is too close or above eyes, student might be looking down/up
                if (nose_tip.y - avg_eye_y) < 0.01:
                    looking_away = True

    # EXTREMELY STRICT: Count humans
    human_labels = ["person", "face", "head", "man", "woman", "personne"]
    detected_humans = [d for d in detections if any(h in d["class"] for h in human_labels)]
    person_count = len(detected_humans)
    
    # If student is looking away, mark as triche
    if looking_away:
        print("👀 ALERTE : L'ÉTUDIANT REGARDE AILLEURS !")
        detections.append({
            "class": "REGARD DÉTOURNÉ",
            "confidence": 0.95,
            "bbox": [0, 0, 100, 100],  # Full frame mark
            "is_triche": True,
            "color": "red"
        })

    # If 2 or more humans -> CHEATING
    multiple_persons_detected = person_count > 1

    if multiple_persons_detected:
        for d in detections:
            if any(h in d["class"] for h in human_labels):
                d["is_triche"] = True
                d["color"] = "red"
                d["class"] = f"TRICHE : {person_count} PERSONNES"
        print(f"🚨 ALERTE : TRICHE DÉTECTÉE ({person_count} PERSONNES)")

    forbidden_object_detected = any(d["is_triche"] for d in detections)
    phone_detected = any("phone" in d["class"].lower() for d in detections)

    return {
        "detections": detections,
        "phone_detected": phone_detected,
        "forbidden_object_detected": forbidden_object_detected or multiple_persons_detected or looking_away,
        "multiple_persons_detected": multiple_persons_detected,
        "looking_away_detected": looking_away,
        "person_count": person_count,
        "count": len(detections)
    }

if __name__ == "__main__":
    import uvicorn
    # Production mode: no hot-reload, 2 workers for concurrent requests
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, workers=2)

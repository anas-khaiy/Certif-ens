from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import requests as http_requests
import os
import re
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
        "http://localhost",
        "http://localhost:80",
        "http://localhost:81",
        "http://localhost:82",
        "http://localhost:83",
        "http://localhost:84",
        "http://localhost:85",
        "http://localhost:86",
        "http://localhost:88",
        "http://localhost:89",
        "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
        "http://localhost:6173", "http://localhost:6174", "http://localhost:6175", "http://localhost:6176",
        "http://localhost:9091", "http://localhost:9092", "http://localhost:9093", "http://localhost:9094"
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
    try:
        # Read the image from the uploaded file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "detections": [],
                "phone_detected": False,
                "forbidden_object_detected": False,
                "multiple_persons_detected": False,
                "looking_away_detected": False,
                "person_count": 0,
                "count": 0,
                "error": "Invalid image file provided."
            }

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
    except Exception as e:
        print(f"Error in detect_objects: {e}")
        return {
            "detections": [],
            "phone_detected": False,
            "forbidden_object_detected": False,
            "multiple_persons_detected": False,
            "looking_away_detected": False,
            "person_count": 0,
            "count": 0,
            "error": str(e)
        }

# ── Student Card Verification Service (QR Code / CIN-based) ─────────────────
import re
from difflib import SequenceMatcher

def _normalize(s: str) -> str:
    """Lowercase, strip accents where possible, collapse whitespace."""
    import unicodedata
    if not s:
        return ""
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')  # strip accents
    return re.sub(r'\s+', ' ', s.strip().lower())

def _detect_qr_code(img) -> str:
    """Detect and decode QR code from the image using pyzbar (extremely robust) and OpenCV as fallback."""
    # 1. Try pyzbar on original image
    try:
        from pyzbar.pyzbar import decode as zbar_decode
        decoded_objs = zbar_decode(img)
        for obj in decoded_objs:
            data = obj.data.decode('utf-8', errors='ignore').strip()
            if data:
                print(f"[ZBAR] Scanned QR Code successfully: '{data}'")
                return data
    except Exception as e:
        print(f"[ZBAR] Error decoding: {e}")

    # 2. Try pyzbar on grayscale
    try:
        from pyzbar.pyzbar import decode as zbar_decode
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        decoded_objs = zbar_decode(gray)
        for obj in decoded_objs:
            data = obj.data.decode('utf-8', errors='ignore').strip()
            if data:
                print(f"[ZBAR-GRAY] Scanned QR Code successfully: '{data}'")
                return data
    except Exception as e:
        print(f"[ZBAR-GRAY] Error: {e}")

    # 3. Try pyzbar on upscaled grayscale
    try:
        from pyzbar.pyzbar import decode as zbar_decode
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape[:2]
        upscaled = cv2.resize(gray, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
        decoded_objs = zbar_decode(upscaled)
        for obj in decoded_objs:
            data = obj.data.decode('utf-8', errors='ignore').strip()
            if data:
                print(f"[ZBAR-UPSCALED] Scanned QR Code successfully: '{data}'")
                return data
    except Exception as e:
        print(f"[ZBAR-UPSCALED] Error: {e}")

    # 4. Fallback to OpenCV QRCodeDetector on original image
    try:
        detector = cv2.QRCodeDetector()
        data, bbox, _ = detector.detectAndDecode(img)
        if data and data.strip():
            print(f"[CV2-QR] Scanned QR Code successfully (fallback): '{data.strip()}'")
            return data.strip()
    except Exception as e:
        print(f"[CV2-QR] Error: {e}")

    # 5. Fallback to OpenCV on upscaled grayscale
    try:
        detector = cv2.QRCodeDetector()
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape[:2]
        upscaled = cv2.resize(gray, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
        data, bbox, _ = detector.detectAndDecode(upscaled)
        if data and data.strip():
            print(f"[CV2-QR-UPSCALED] Scanned QR Code successfully (fallback): '{data.strip()}'")
            return data.strip()
    except Exception as e:
        print(f"[CV2-QR-UPSCALED] Error: {e}")

    return ""


def _get_normalized_landmarks(face_landmarks, width, height):
    """Convert landmarks to pixel space, translate to origin, and scale to unit variance."""
    pts = np.array([[l.x * width, l.y * height] for l in face_landmarks.landmark])
    center = np.mean(pts, axis=0)
    centered = pts - center
    scale = np.mean(np.linalg.norm(centered, axis=1))
    if scale > 0:
        return centered / scale
    return centered

def _compare_face_geometry(face1, face2, width, height) -> float:
    """Compute average Euclidean distance between two normalized face landmark meshes."""
    norm1 = _get_normalized_landmarks(face1, width, height)
    norm2 = _get_normalized_landmarks(face2, width, height)
    # Mean Euclidean distance between corresponding points
    return float(np.mean(np.linalg.norm(norm1 - norm2, axis=1)))

# Separate face mesh instance for multi-face detection (user + card photo)
try:
    face_mesh_verification = mp_face_mesh.FaceMesh(
        max_num_faces=3,
        refine_landmarks=True,
        min_detection_confidence=0.4,
        min_tracking_confidence=0.4
    )
except Exception as e:
    print(f"WARNING: Verification FaceMesh could not be initialized: {e}")
    face_mesh_verification = None

@app.post("/verify-card")
async def verify_card(
    file: UploadFile = File(...),
    cin: str = Form(""),
    nom: str = Form(""),
    prenom: str = Form(""),
    skip_qr: bool = Form(False)
):
    try:
        # Read uploaded file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "success": False,
                "error": "Invalid image file provided.",
                "qr_code_detected": False,
                "extracted_cin": "",
                "cin_expected": cin,
                "cin_matched": False,
                "face_matched": False,
                "face_distance": 1.0,
                "faces_detected": 0
            }

        h, w = img.shape[:2]

        if skip_qr:
            decoded_cin = cin
            cin_matched = True
        else:
            # 1. Scan for QR code containing CIN
            decoded_cin = _detect_qr_code(img)
            
            # Check CIN matching
            cin_matched = False
            if decoded_cin and cin:
                cin_matched = _normalize(decoded_cin) == _normalize(cin)
                if not cin_matched:
                    cin_matched = _normalize(cin) in _normalize(decoded_cin) or _normalize(decoded_cin) in _normalize(cin)
            elif decoded_cin and not cin:
                cin_matched = True

        # 2. Biometric Face Verification (User vs Card Photo)
        face_matched = not skip_qr  # Default to False if skip_qr is True
        face_distance = 0.0
        faces_detected = 0

        if face_mesh_verification is not None:
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_mesh_verification.process(img_rgb)
            
            if results.multi_face_landmarks:
                faces_detected = len(results.multi_face_landmarks)
                
                # If we detect 2 or more faces in the webcam feed (user + card photo)
                if faces_detected >= 2:
                    # Calculate bounding box area for each face to sort them by size
                    face_areas = []
                    for landmarks in results.multi_face_landmarks:
                        pts = np.array([[l.x * w, l.y * h] for l in landmarks.landmark])
                        min_x, min_y = np.min(pts, axis=0)
                        max_x, max_y = np.max(pts, axis=0)
                        area = (max_x - min_x) * (max_y - min_y)
                        face_areas.append((area, landmarks))
                    
                    # Sort faces by bounding box area (largest first)
                    # Largest = Live User, Second Largest = Card Photo
                    face_areas.sort(key=lambda x: x[0], reverse=True)
                    
                    face_live = face_areas[0][1]
                    face_card = face_areas[1][1]
                    
                    # Compare geometric structure of both faces
                    face_distance = _compare_face_geometry(face_live, face_card, w, h)
                    
                    # Convert distance to a similarity percentage (0.20 distance -> 60% similarity)
                    face_similarity_percentage = max(0.0, min(100.0, 100.0 - (face_distance * 200.0)))
                    
                    # User requested a 60% threshold
                    face_matched = face_similarity_percentage >= 60.0
                    print(f"[BIOMETRICS] Face comparison distance: {face_distance:.4f} | Similarity: {face_similarity_percentage:.1f}% | Matched: {face_matched}")
                else:
                    if skip_qr:
                        face_matched = False
                    print(f"[BIOMETRICS] Only {faces_detected} face detected. Enforcing CIN QR code check only.")

        is_valid = bool(cin_matched and face_matched)
        status = "✅ VÉRIFIÉ" if is_valid else "❌ ÉCHEC"
        print(f"[{status}] CIN Match: {cin_matched} | Face Match: {face_matched} (dist={face_distance:.4f}, faces={faces_detected})")

        return {
            "success": is_valid,
            "qr_code_detected": bool(decoded_cin),
            "extracted_cin": decoded_cin,
            "cin_expected": cin,
            "cin_matched": bool(cin_matched),
            "face_matched": bool(face_matched),
            "face_distance": float(face_distance),
            "face_similarity_percentage": float(face_similarity_percentage) if 'face_similarity_percentage' in locals() else 0.0,
            "faces_detected": int(faces_detected)
        }
    except Exception as e:
        print(f"Error in verify_card: {e}")
        return {
            "success": False,
            "error": str(e),
            "qr_code_detected": False,
            "extracted_cin": "",
            "cin_expected": cin,
            "cin_matched": False,
            "face_matched": False,
            "face_distance": 1.0,
            "faces_detected": 0
        }

def _get_largest_face(img):
    if face_mesh_verification is None: return None, 0, 0, 0
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = img.shape[:2]
    results = face_mesh_verification.process(img_rgb)
    if not results.multi_face_landmarks: return None, w, h, 0
    
    face_areas = []
    for landmarks in results.multi_face_landmarks:
        pts = np.array([[l.x * w, l.y * h] for l in landmarks.landmark])
        min_x, min_y = np.min(pts, axis=0)
        max_x, max_y = np.max(pts, axis=0)
        area = (max_x - min_x) * (max_y - min_y)
        face_areas.append((area, landmarks))
    
    face_areas.sort(key=lambda x: x[0], reverse=True)
    return face_areas[0][1], w, h, face_areas[0][0]

def _is_card_face(landmarks, face_area, img_w, img_h):
    """
    Heuristic to determine if a face is from a printed card vs a live 3D person.
    Printed cards have flat faces (low Z variance and small Z range).
    """
    z_values = [l.z for l in landmarks.landmark]
    z_std = float(np.std(z_values))
    z_range = float(np.max(z_values) - np.min(z_values))
    face_area_ratio = face_area / (img_w * img_h)
    
    print(f"[CARD HEURISTIC] z_std: {z_std:.5f}, z_range: {z_range:.5f}, area_ratio: {face_area_ratio:.4f}")
    
    # Real faces typically have z_std > 0.025 and z_range > 0.12
    # Card photos are flat: z_std is very low.
    # We increase the threshold slightly to catch more card photos, 
    # but keep it low enough to not catch real faces.
    if z_std < 0.022 or z_range < 0.10:
        return True
    return False

@app.post("/check-card-face")
async def check_card_face(card_image: UploadFile = File(...)):
    try:
        contents = await card_image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"success": False, "error": "Format d'image invalide."}

        # Ensure we always get 4 values from _get_largest_face
        result = _get_largest_face(img)
        if len(result) != 4:
            return {"success": False, "error": "Erreur interne de détection (mismatch)."}
            
        landmarks, w, h, area = result
        if landmarks is None:
            return {"success": False, "error": "Veuillez présenter la face de la carte."}

        is_card = _is_card_face(landmarks, area, w, h)
        if not is_card:
            return {"success": False, "error": "Ceci ressemble à un visage réel. Veuillez montrer la photo sur la carte."}

        return {"success": True}
    except Exception as e:
        print(f"Error in check_card_face: {e}")
        return {"success": False, "error": "Erreur lors de l'analyse de la carte."}

@app.post("/verify-faces")
async def verify_faces(
    card_image: UploadFile = File(...),
    live_image: UploadFile = File(...)
):
    try:
        # Read card image
        card_contents = await card_image.read()
        card_nparr = np.frombuffer(card_contents, np.uint8)
        card_img = cv2.imdecode(card_nparr, cv2.IMREAD_COLOR)

        # Read live image
        live_contents = await live_image.read()
        live_nparr = np.frombuffer(live_contents, np.uint8)
        live_img = cv2.imdecode(live_nparr, cv2.IMREAD_COLOR)

        if card_img is None or live_img is None:
            return {"success": False, "error": "Images invalides."}

        # Extract faces - safely
        res_card = _get_largest_face(card_img)
        res_live = _get_largest_face(live_img)
        
        if len(res_card) != 4 or len(res_live) != 4:
            return {"success": False, "error": "Erreur de traitement des visages."}

        face_card, cw, ch, c_area = res_card
        face_live, lw, lh, l_area = res_live

        if face_card is None:
            return {"success": False, "error": "Visage non détecté sur la carte. Rapprochez la carte."}
        
        # Verify if it's really a card face
        if not _is_card_face(face_card, c_area, cw, ch):
             return {"success": False, "error": "Veuillez montrer la photo de la carte (Step 1)."}

        if face_live is None:
            return {"success": False, "error": "Regardez l'objectif, visage non détecté."}

        # CRITICAL: Verify if the "live" face is actually a real person (3D) and not the card again
        if _is_card_face(face_live, l_area, lw, lh):
             return {"success": False, "error": "Veuillez montrer votre visage réel, pas la carte."}

        # Compare face geometry (we normalize based on live image dimensions for consistency)
        face_distance = _compare_face_geometry(face_live, face_card, lw, lh)
        
        # Convert to percentage
        # Convert distance to a similarity percentage (0.20 distance -> 60% similarity)
        face_similarity_percentage = max(0.0, min(100.0, 100.0 - (face_distance * 200.0)))
        
        # Threshold at 60%
        face_matched = face_similarity_percentage >= 60.0
        
        print(f"[BIOMETRICS 3-STEP] Face comparison dist: {face_distance:.4f} | Similarity: {face_similarity_percentage:.1f}% | Matched: {face_matched}")

        return {
            "success": bool(face_matched),
            "face_matched": bool(face_matched),
            "face_similarity_percentage": float(face_similarity_percentage)
        }
    except Exception as e:
        print(f"Error in verify_faces: {e}")
        return {"success": False, "error": "Erreur de comparaison biométrique."}
# ─── AI Open-Answer Grading Endpoint ─────────────────────────────────────────
# The AI reads the question statement and the learner's answer,
# then predicts whether the answer is correct (1) or not (0).
# Criteria (if provided) are used as evaluation hints.

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")

# Serialize Ollama calls — a 7B model cannot handle concurrent generate requests
# (returns HTTP 500 under load). Only 1 LLM call at a time.
import asyncio
_llm_semaphore = asyncio.Semaphore(1)


class GradeOpenAnswerRequest(BaseModel):
    question: str
    answer: str
    criteria: List[str] = []


def _normalize_text(text: str) -> str:
    text = text.lower()
    replacements = {"é": "e", "è": "e", "ê": "e", "ë": "e",
                    "à": "a", "â": "a", "ä": "a",
                    "î": "i", "ï": "i",
                    "ô": "o", "ö": "o",
                    "ù": "u", "û": "u", "ü": "u",
                    "ç": "c"}
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def _is_gibberish(text: str) -> bool:
    """Detect if text is random gibberish (not a real answer)."""
    text = text.strip()
    if len(text) < 3:
        return True

    # Must contain at least one vowel (French + English)
    vowels = set("aeiouyàâäéèêëîïôöùûü")
    if not any(c in vowels for c in text.lower()):
        return True

    # Check consonant/vowel ratio — gibberish like "dfdfcddscsdcsdc" has almost no vowels
    letter_count = sum(1 for c in text if c.isalpha())
    if letter_count > 5:
        vowel_count = sum(1 for c in text.lower() if c in vowels)
        if vowel_count / letter_count < 0.15:
            return True

    # Check for long consonant runs (5+ consonants in a row = likely gibberish)
    # Note: y is excluded (treated as vowel-like, common in French: "physique", "synthèse")
    consonants = set("bcdfghjklmnpqrstvzBCDFGHJKLMNPQRSTVZ")
    run = 0
    for c in text:
        if c in consonants:
            run += 1
            if run >= 5:
                return True
        else:
            run = 0

    # Check word-level: if no spaces and long, suspicious
    if " " not in text and len(text) > 15:
        return True

    return False


def _fallback_grading(question: str, answer: str, criteria: List[str]) -> int:
    """Fallback: keyword matching if criteria exist, else basic heuristic."""
    if criteria:
        normalized_answer = _normalize_text(answer)
        found = sum(1 for c in criteria if _normalize_text(c.strip()) in normalized_answer)
        return 1 if found >= len(criteria) * 0.5 else 0
    # No criteria: consider answer correct if it has some content related to question keywords
    q_words = set(_normalize_text(question).split())
    a_words = set(_normalize_text(answer).split())
    # Remove common stopwords
    stop_words = {"le", "la", "les", "un", "une", "des", "de", "du", "des", "et", "ou",
                  "est", "sont", "quel", "quelle", "quels", "quelles", "expliquer",
                  "définir", "definir", "donnez", "donner", "c'est", "ce", "qui", "que",
                  "dans", "par", "pour", "sur", "avec", "pas", "ne", "pas", "se", "sa",
                  "son", "ses", "au", "aux", "en", "à", "a", "the", "is", "are", "what"}
    q_keywords = q_words - stop_words
    if not q_keywords:
        return 1 if len(answer.strip()) > 10 else 0
    overlap = len(q_keywords & a_words)
    return 1 if overlap >= max(1, len(q_keywords) // 4) else 0


def _grade_with_llm(question: str, answer: str, criteria: List[str]) -> tuple:
    """Use Ollama LLM to evaluate if the answer is correct given the question.
    Returns (is_correct: int, feedback: str)."""
    criteria_section = ""
    if criteria:
        criteria_list = "\n".join([f"  - {c}" for c in criteria])
        criteria_section = f"""
Key criteria to check in the answer:
{criteria_list}
"""

    prompt = f"""You are an automatic quiz grader. Read the question and the student's answer carefully.

QUESTION:
{question}
{criteria_section}STUDENT ANSWER:
{answer}

Your task: decide if the student answer is correct or incorrect.
- 1 means CORRECT: The answer is a real, meaningful sentence that is relevant and factually reasonable for the question. Partial answers that address the main idea count as correct.
- 0 means INCORRECT: The answer is empty, random gibberish/characters, completely off-topic, or factually wrong.

IMPORTANT: Random strings of letters like "dfdfcddscsdcsdc" or "asdfghjkl" are ALWAYS incorrect (0).

Analyze step by step. After your analysis, write a brief 1-2 sentence explanation of WHY the answer is correct or incorrect (in French). Then on the very last line write exactly:
FINAL ANSWER: 0
or
FINAL ANSWER: 1
Do NOT output anything after that line."""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = http_requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.2}
                },
                timeout=120
            )
            resp.raise_for_status()
            text = resp.json().get("response", "").strip()
            print(f"[LLM RAW] {text[:500]}")

            # Extract feedback: everything before FINAL ANSWER line, cleaned up
            feedback = ""
            fb_match = re.split(r'FINAL\s+ANSWER:\s*[01]', text, flags=re.IGNORECASE)
            if fb_match:
                raw_fb = fb_match[0].strip()
                # Remove "Let's analyze" / step-by-step preamble, keep the explanation
                # Take the last 2-3 sentences before FINAL ANSWER
                sentences = re.split(r'(?<=[.!?])\s+', raw_fb)
                # Filter out analysis steps (numbered lists, "Let me", etc.)
                meaningful = [s for s in sentences if s.strip() and not re.match(r'^[\d\*\-]', s.strip()) and 'step' not in s.lower()[:20]]
                if meaningful:
                    feedback = ' '.join(meaningful[-3:]).strip()
                else:
                    feedback = raw_fb[-300:].strip()

            # 1. Look for explicit FINAL ANSWER marker (most reliable)
            is_correct = None
            m = re.search(r'FINAL\s+ANSWER:\s*([01])\b', text, re.IGNORECASE)
            if m:
                is_correct = int(m.group(1))

            # 2. Semantic fallback: look for conclusion patterns
            if is_correct is None:
                conclusions = re.findall(r'(?:answer|response)\s+is\s+(correct|incorrect)\b', text, re.IGNORECASE)
                if conclusions:
                    is_correct = 1 if conclusions[-1].lower() == 'correct' else 0

            # 3. Last standalone 0 or 1 in the response
            if is_correct is None:
                matches = re.findall(r'\b([01])\b', text)
                if matches:
                    is_correct = int(matches[-1])
            # 4. Fallback: find any 0 or 1
            if is_correct is None:
                match = re.search(r'([01])', text)
                if match:
                    is_correct = int(match.group(1))
            if is_correct is None:
                raise ValueError("No valid 0/1 in LLM response")

            # Build final feedback
            if is_correct == 1:
                default_fb = "La réponse est correcte et pertinente."
            else:
                default_fb = "La réponse est incorrecte ou hors sujet."
            if feedback and len(feedback) > 20:
                feedback = f"{default_fb} {feedback}"
            else:
                feedback = default_fb

            return (is_correct, feedback)
        except Exception as e:
            print(f"LLM attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                import time
                time.sleep(1.5 * (attempt + 1))  # backoff: 1.5s, 3s
            else:
                print(f"LLM grading failed after {max_retries} attempts, falling back to keyword matching")
                fb = "Correction automatique par mots-clés (IA indisponible)."
                return (_fallback_grading(question, answer, criteria), fb)


@app.post("/grade-open-answer")
async def grade_open_answer(request: GradeOpenAnswerRequest):
    """
    AI reads the question statement and the learner's answer,
    then predicts whether the answer is correct (1) or not (0).
    - Uses Ollama LLM for semantic understanding.
    - Falls back to keyword matching if LLM is unavailable.
    """
    try:
        question = request.question.strip()
        answer = request.answer.strip()
        criteria = [c.strip() for c in request.criteria if c.strip()]

        if not answer:
            return {
                "is_correct": 0,
                "score": 0,
                "graded_by": "none",
                "feedback": "Réponse vide"
            }

        if not question:
            return {
                "is_correct": 0,
                "score": 0,
                "graded_by": "none",
                "feedback": "Question non définie"
            }

        # Quick gibberish check before calling LLM
        if _is_gibberish(answer):
            return {
                "is_correct": 0,
                "score": 0,
                "feedback": "Réponse incorrecte (texte non compréhensible)",
                "graded_by": "ai"
            }

        # LLM grading: serialize calls — Ollama 7B can't handle concurrent generate
        async with _llm_semaphore:
            is_correct, feedback = await asyncio.to_thread(_grade_with_llm, question, answer, criteria)

        print(f"[AI GRADING] Q='{question[:60]}...' | A='{answer[:60]}...' | Correct={is_correct}")

        return {
            "is_correct": is_correct,
            "score": is_correct,
            "feedback": feedback,
            "graded_by": "ai"
        }
    except Exception as e:
        print(f"Error in grade_open_answer: {e}")
        return {"error": f"Erreur de correction IA: {str(e)}", "is_correct": 0}


if __name__ == "__main__":
    import uvicorn
    # 1 worker: Ollama 7B cannot handle concurrent generate requests (HTTP 500).
    # A single worker serializes all LLM calls through the asyncio semaphore.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, workers=1)

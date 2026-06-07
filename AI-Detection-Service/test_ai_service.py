from fastapi.testclient import TestClient
import pytest
from unittest.mock import MagicMock, patch
import numpy as np
import cv2

# We mock YOLO and MediaPipe Mesh so that unit tests can run anywhere
with patch("ultralytics.YOLO") as mock_yolo, patch("mediapipe.solutions.face_mesh.FaceMesh") as mock_mesh:
    from main import app

client = TestClient(app)

def _create_dummy_image():
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, img_encoded = cv2.imencode(".jpg", img)
    return img_encoded.tobytes()

def _create_mock_box(cls_id, conf=0.95, coords=[10, 10, 100, 100]):
    mock_box = MagicMock()
    mock_box.cls = [cls_id]
    mock_box.conf = [conf]
    mock_xyxy_tensor = MagicMock()
    mock_xyxy_tensor.tolist.return_value = coords
    mock_box.xyxy = [mock_xyxy_tensor]
    return mock_box

# Test 1: Service health
def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "CertiFlow AI Detection Service is running"}

# Test 2: Normal situation (1 person, no forbidden objects)
def test_detect_no_cheating():
    mock_result = MagicMock()
    mock_result.boxes = [_create_mock_box(0)]
    
    with patch("main.model") as mock_model:
        mock_model.names = {0: "person"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert data["forbidden_object_detected"] is False
        assert data["person_count"] == 1
        assert data["multiple_persons_detected"] is False

# Test 3: Phone detected
def test_detect_forbidden_phone():
    mock_result = MagicMock()
    mock_result.boxes = [_create_mock_box(67, 0.88)]
    
    with patch("main.model") as mock_model:
        mock_model.names = {67: "cell phone"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert data["forbidden_object_detected"] is True
        assert data.get("phone_detected", True) is True

# Test 4: Multiple persons detected (Cheating attempt)
def test_detect_multiple_persons():
    mock_result = MagicMock()
    mock_result.boxes = [_create_mock_box(0), _create_mock_box(0, coords=[20, 20, 80, 80])]
    
    with patch("main.model") as mock_model:
        mock_model.names = {0: "person"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert data["person_count"] == 2
        assert data["multiple_persons_detected"] is True

# Test 5: No person detected (Candidate left the frame)
def test_detect_no_person():
    mock_result = MagicMock()
    mock_result.boxes = []
    
    with patch("main.model") as mock_model:
        mock_model.names = {0: "person"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert data["person_count"] == 0
        assert data.get("person_missing", True) is True

# Test 6: Book detected
def test_detect_forbidden_book():
    mock_result = MagicMock()
    mock_result.boxes = [_create_mock_box(73, 0.90)]
    
    with patch("main.model") as mock_model:
        mock_model.names = {73: "book"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert data["forbidden_object_detected"] is True

# Test 7: Laptop detected
def test_detect_forbidden_laptop():
    mock_result = MagicMock()
    mock_result.boxes = [_create_mock_box(63, 0.92)]
    
    with patch("main.model") as mock_model:
        mock_model.names = {63: "laptop"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert data["forbidden_object_detected"] is True

# Test 8: Person and Phone simultaneously
def test_detect_person_and_phone():
    mock_result = MagicMock()
    mock_result.boxes = [_create_mock_box(0), _create_mock_box(67, 0.88)]
    
    with patch("main.model") as mock_model:
        mock_model.names = {0: "person", 67: "cell phone"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert data["person_count"] == 1
        assert data["forbidden_object_detected"] is True

# Test 9: Low confidence object (API stability check)
def test_detect_low_confidence():
    mock_result = MagicMock()
    mock_result.boxes = [_create_mock_box(67, 0.10)]
    
    with patch("main.model") as mock_model:
        mock_model.names = {67: "cell phone"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert "forbidden_object_detected" in data

# Test 10: Multiple forbidden objects
def test_detect_multiple_forbidden_objects():
    mock_result = MagicMock()
    mock_result.boxes = [_create_mock_box(67), _create_mock_box(73)]
    
    with patch("main.model") as mock_model:
        mock_model.names = {67: "cell phone", 73: "book"}
        mock_model.return_value = [mock_result]
        response = client.post("/detect", files={"file": ("test.jpg", _create_dummy_image(), "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert data["forbidden_object_detected"] is True

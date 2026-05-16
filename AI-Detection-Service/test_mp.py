import mediapipe as mp
try:
    print(mp.solutions.face_mesh)
    print("SUCCESS")
except Exception as e:
    print(e)

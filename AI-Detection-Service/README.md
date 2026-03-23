# CertiFlow AI Detection Service (Python)

Ce microservice utilise **FastAPI** et **YOLOv8** pour détecter la triche (téléphones portables) via des requêtes HTTP.

## 🚀 Installation

1. Assurez-vous d'avoir Python installé.
2. Ouvrez un terminal dans ce dossier.
3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

## 🏃 Démarage

Lancez le serveur avec :
```bash
python main.py
```
Le serveur sera disponible sur `http://localhost:8000`.

## 📡 API

- **POST `/detect`** : Envoyez un fichier image (multipart/form-data).
  - Retourne la liste des détections et un indicateur `phone_detected`.

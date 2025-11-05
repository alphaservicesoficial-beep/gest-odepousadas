import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage

# Evita erro de reinit
if not firebase_admin._apps:
    firebase_key_str = os.getenv("FIREBASE_KEY")

    if firebase_key_str:
        try:
            firebase_key = json.loads(firebase_key_str)
            cred = credentials.Certificate(firebase_key)
            print("✅ Firebase conectado via variável FIREBASE_KEY")
        except Exception as e:
            print("❌ Erro ao carregar FIREBASE_KEY:", e)
            raise
    else:
        cred_path = os.path.join(os.path.dirname(__file__), "firebase-key.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            print("✅ Firebase conectado via arquivo local")
        else:
            raise FileNotFoundError("Nenhuma credencial Firebase encontrada!")

    firebase_admin.initialize_app(cred)

db = firestore.client()

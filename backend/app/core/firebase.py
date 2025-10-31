import json
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage

firebase_key_str = os.getenv("FIREBASE_KEY")

if firebase_key_str:
    firebase_key = json.loads(firebase_key_str)
    cred = credentials.Certificate(firebase_key)
else:
    # Fallback local
    cred_path = os.path.join(os.path.dirname(__file__), "firebase-key.json")
    cred = credentials.Certificate(cred_path)

firebase_admin.initialize_app(cred)
db = firestore.client()

import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Caminho do arquivo JSON
cred_path = os.path.join(os.path.dirname(__file__), "firebase-key.json")

# Inicializa o Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

# Instância global do Firestore
db = firestore.client()

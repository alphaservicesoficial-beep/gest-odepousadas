from app.core.firebase import db

doc_id = "Im8Kn7X7XLo8mnIRXLax"

print("🔎 Verificando documento no Firestore...")

doc_ref = db.collection("companies").document(doc_id).get()

if doc_ref.exists:
    print("✅ Documento encontrado!")
    print("Dados:", doc_ref.to_dict())
else:
    print("❌ Documento NÃO encontrado no Firestore.")

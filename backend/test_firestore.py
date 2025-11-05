from app.core.firebase import db

reservas_ref = db.collection("reservations").stream()
reservas = [r.to_dict() for r in reservas_ref]

print(f"Total de reservas: {len(reservas)}")
for r in reservas:
    print(r)

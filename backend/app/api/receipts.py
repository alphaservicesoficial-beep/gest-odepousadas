# app/api/receipts.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from datetime import datetime
from app.core.firebase import db

# opcional: pip install reportlab
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

router = APIRouter()

def _brl(value) -> str:
    try:
        v = float(str(value).replace(",", "."))
    except Exception:
        v = 0.0
    s = f"R$ {v:,.2f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")

def _resolve_room_number(data: dict) -> str:
    rn = (data or {}).get("roomNumber")
    if rn:
        return str(rn)
    room_id = (data or {}).get("roomId") or ""
    if not room_id:
        return "—"
    snap = db.collection("rooms").document(room_id).get()
    if snap.exists:
        number = (snap.to_dict() or {}).get("number")
        if number:
            return str(number)
    # fallback: extrai dígitos de algo como "RM-105"
    import re
    digits = "".join(re.findall(r"\d+", room_id))
    return digits or "—"

@router.get("/reservations/{reservation_id}/receipt")
def generate_reservation_receipt(reservation_id: str):
    """
    Gera um PDF de comprovante da reserva (hóspede/empresa),
    usando dados de /settings/property para cabeçalho (nome, endereço, CNPJ).
    """
    # --- busca reserva ---
    doc = db.collection("reservations").document(reservation_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")
    res = doc.to_dict() or {}

    # --- busca settings (cabeçalho) ---
    sdoc = db.collection("settings").document("property").get()
    settings = sdoc.to_dict() if sdoc.exists else {}
    prop_name = settings.get("propertyName", "Pousada")
    prop_addr = settings.get("address", "")
    prop_cnpj = settings.get("cnpj", settings.get("CNPJ", ""))  # aceita CNPJ ou cnpj
    prop_phone = settings.get("phone", "")

    # --- dados de exibição ---
    guest_or_company = res.get("guestName") or res.get("companyName") or "—"
    room_number = _resolve_room_number(res)
    check_in = res.get("checkIn", "—")
    check_out = res.get("checkOut", "—")
    guests = str(res.get("guests", 1))
    status = res.get("status") or res.get("reservationStatus") or "—"
    pay_status = res.get("paymentStatus", "pendente")
    pay_method = res.get("paymentMethod", "—")
    total = _brl(res.get("value", 0))
    generated_at = datetime.now().strftime("%d/%m/%Y %H:%M")

    # --- monta PDF em memória ---
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    x_margin = 20 * mm
    y = height - 20 * mm

    # Cabeçalho
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x_margin, y, prop_name)
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    if prop_addr:
        c.drawString(x_margin, y, prop_addr)
        y -= 5 * mm
    if prop_phone:
        c.drawString(x_margin, y, f"Telefone: {prop_phone}")
        y -= 5 * mm
    if prop_cnpj:
        c.drawString(x_margin, y, f"CNPJ: {prop_cnpj}")
        y -= 5 * mm

    y -= 4 * mm
    c.setLineWidth(0.7)
    c.line(x_margin, y, width - x_margin, y)
    y -= 10 * mm

    # Título
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x_margin, y, "Comprovante de Reserva")
    c.setFont("Helvetica", 10)
    c.drawRightString(width - x_margin, y, f"Emitido em {generated_at}")
    y -= 10 * mm

    # Corpo
    lines = [
        ("Nome/Empresa:", guest_or_company),
        ("ID da Reserva:", reservation_id),
        ("Quarto:", room_number),
        ("Check-in:", check_in),
        ("Check-out:", check_out),
        ("Hóspedes:", guests),
        ("Status da Reserva:", status.capitalize() if isinstance(status, str) else status),
        ("Status do Pagamento:", pay_status.capitalize() if isinstance(pay_status, str) else pay_status),
        ("Método de Pagamento:", pay_method),
        ("Valor:", total),
    ]

    c.setFont("Helvetica", 11)
    for label, value in lines:
        c.drawString(x_margin, y, label)
        c.drawString(x_margin + 45 * mm, y, str(value))
        y -= 7 * mm

    y -= 6 * mm
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(
        x_margin,
        y,
        "Este documento comprova a reserva realizada e poderá ser solicitado no check-in."
    )

    # rodapé
    c.showPage()
    c.save()
    buf.seek(0)

    filename = f"comprovante_{reservation_id}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

from datetime import date

from fastapi import APIRouter, HTTPException

from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate

router = APIRouter()

_EXPENSES = {
    "EXP-001": ExpenseResponse(
        id="EXP-001",
        description="Compra de produtos de limpeza",
        category="Suprimentos",
        date=date.today(),
        amount=320.50,
    )
}


@router.get("/", response_model=list[ExpenseResponse])
async def list_expenses() -> list[ExpenseResponse]:
    return list(_EXPENSES.values())


@router.post("/", response_model=ExpenseResponse, status_code=201)
async def create_expense(payload: ExpenseCreate) -> ExpenseResponse:
    expense_id = f"EXP-{len(_EXPENSES) + 1:03d}"
    expense = ExpenseResponse(id=expense_id, **payload.model_dump())
    _EXPENSES[expense_id] = expense
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: str, payload: ExpenseUpdate) -> ExpenseResponse:
    if expense_id not in _EXPENSES:
        raise HTTPException(status_code=404, detail="Despesa não encontrada.")

    stored = _EXPENSES[expense_id]
    updated = stored.model_copy(update=payload.model_dump(exclude_unset=True))
    _EXPENSES[expense_id] = updated
    return updated

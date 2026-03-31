from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.crud import crud_card_slot
from app.database import get_db

router = APIRouter(
    prefix="/slots",
    tags=["slots"],
)

@router.put("/page/{page_id}/index/{slot_index}", response_model=schemas.CardSlotResponse)
def upsert_card_slot(page_id: int, slot_index: int, slot_update: schemas.CardSlotUpdate, db: Session = Depends(get_db)):
    return crud_card_slot.update_card_slot(db, page_id=page_id, slot_index=slot_index, slot_update=slot_update)

@router.delete("/page/{page_id}/index/{slot_index}")
def delete_card_slot(page_id: int, slot_index: int, db: Session = Depends(get_db)):
    crud_card_slot.clear_card_slot(db, page_id=page_id, slot_index=slot_index)
    return {"detail": "Slot cleared successfully"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.crud import crud_card_slot, crud_page
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/slots",
    tags=["slots"],
)

@router.put("/page/{page_id}/index/{slot_index}", response_model=schemas.CardSlotResponse)
def upsert_card_slot(
    page_id: int,
    slot_index: int,
    slot_update: schemas.CardSlotUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_page = crud_page.get_page(db, page_id=page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    if db_page.binder.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this page")
    return crud_card_slot.update_card_slot(db, page_id=page_id, slot_index=slot_index, slot_update=slot_update)

@router.delete("/page/{page_id}/index/{slot_index}")
def delete_card_slot(
    page_id: int,
    slot_index: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_page = crud_page.get_page(db, page_id=page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    if db_page.binder.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this page")
    crud_card_slot.clear_card_slot(db, page_id=page_id, slot_index=slot_index)
    return {"detail": "Slot cleared successfully"}

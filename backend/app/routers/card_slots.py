# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
import logging
from datetime import datetime

from app import schemas, models
from app.crud import crud_card_slot, crud_page
from app.database import get_db, SessionLocal
from app.dependencies import get_current_user
from app.utils.pricing import fetch_card_price

logger = logging.getLogger("holovault.card_slots")

router = APIRouter(
    prefix="/slots",
    tags=["slots"],
)

async def update_card_price_task(slot_id: int):
    """
    Asynchronous background task to fetch and save card market value,
    using a dedicated short-lived DB session.
    """
    db = SessionLocal()
    try:
        slot = db.query(models.CardSlot).filter(models.CardSlot.id == slot_id).first()
        if slot and slot.name:
            price = await fetch_card_price(slot.name, slot.set_name)
            slot.market_price = price
            slot.last_pricing_update = datetime.utcnow()
            db.commit()
            logger.info(f"Background task successfully resolved price for slot {slot_id} -> ${price}")
    except Exception as e:
        logger.error(f"Error executing background pricing task for slot {slot_id}: {e}")
    finally:
        db.close()

@router.put("/page/{page_id}/index/{slot_index}", response_model=schemas.CardSlotResponse)
def upsert_card_slot(
    page_id: int,
    slot_index: int,
    slot_update: schemas.CardSlotUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_page = crud_page.get_page(db, page_id=page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    if db_page.binder.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this page")
    
    updated_slot = crud_card_slot.update_card_slot(db, page_id=page_id, slot_index=slot_index, slot_update=slot_update)
    
    # If the user edited the card name, trigger immediate pricing resolve in the background
    if slot_update.name:
        background_tasks.add_task(update_card_price_task, updated_slot.id)
        
    return updated_slot

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

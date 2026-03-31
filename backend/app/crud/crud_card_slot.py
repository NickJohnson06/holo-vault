from sqlalchemy.orm import Session
from app import models, schemas

def update_card_slot(db: Session, page_id: int, slot_index: int, slot_update: schemas.CardSlotUpdate):
    db_slot = db.query(models.CardSlot).filter(
        models.CardSlot.page_id == page_id,
        models.CardSlot.slot_index == slot_index
    ).first()
    
    if db_slot:
        update_data = slot_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_slot, key, value)
    else:
        db_slot = models.CardSlot(
            page_id=page_id,
            slot_index=slot_index,
            **slot_update.model_dump(exclude_unset=True)
        )
        db.add(db_slot)
    
    db.commit()
    db.refresh(db_slot)
    return db_slot

def clear_card_slot(db: Session, page_id: int, slot_index: int):
    db_slot = db.query(models.CardSlot).filter(
        models.CardSlot.page_id == page_id,
        models.CardSlot.slot_index == slot_index
    ).first()
    if db_slot:
        db.delete(db_slot)
        db.commit()

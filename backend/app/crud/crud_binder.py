from sqlalchemy.orm import Session
from app import models, schemas

def get_binder(db: Session, binder_id: int):
    return db.query(models.Binder).filter(models.Binder.id == binder_id).first()

def get_binders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Binder).offset(skip).limit(limit).all()

def get_user_binders(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Binder).filter(models.Binder.owner_id == owner_id).offset(skip).limit(limit).all()

def create_binder(db: Session, binder: schemas.BinderCreate, owner_id: int):
    # Pass owner_id as well since it's required by the Binder model
    db_binder = models.Binder(**binder.model_dump(), owner_id=owner_id)
    db.add(db_binder)
    db.commit()
    db.refresh(db_binder)
    return db_binder

def update_binder(db: Session, binder_id: int, binder_update: schemas.BinderUpdate):
    db_binder = db.query(models.Binder).filter(models.Binder.id == binder_id).first()
    if db_binder:
        update_data = binder_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_binder, key, value)
        db.commit()
        db.refresh(db_binder)
    return db_binder

def delete_binder(db: Session, binder_id: int):
    db_binder = db.query(models.Binder).filter(models.Binder.id == binder_id).first()
    if db_binder:
        db.delete(db_binder)
        db.commit()
    return db_binder

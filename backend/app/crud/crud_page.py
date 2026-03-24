from sqlalchemy.orm import Session
from app import models, schemas

def get_page(db: Session, page_id: int):
    return db.query(models.Page).filter(models.Page.id == page_id).first()

def get_pages_for_binder(db: Session, binder_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Page).filter(models.Page.binder_id == binder_id).offset(skip).limit(limit).all()

def create_page(db: Session, page: schemas.PageCreate):
    db_page = models.Page(**page.model_dump())
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def update_page(db: Session, page_id: int, page_update: schemas.PageUpdate):
    db_page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if db_page:
        update_data = page_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_page, key, value)
        db.commit()
        db.refresh(db_page)
    return db_page

def delete_page(db: Session, page_id: int):
    db_page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if db_page:
        db.delete(db_page)
        db.commit()
    return db_page

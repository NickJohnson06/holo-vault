from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.crud import crud_binder
from app.database import get_db

router = APIRouter(
    prefix="/binders",
    tags=["binders"],
)

@router.post("/", response_model=schemas.BinderResponse)
def create_binder(binder: schemas.BinderCreate, db: Session = Depends(get_db)):
    # Note: owner_id is hardcoded to 1 for now. We will replace this in Phase 3 with Auth
    owner_id = 1 
    return crud_binder.create_binder(db=db, binder=binder, owner_id=owner_id)

@router.get("/", response_model=List[schemas.BinderResponse])
def read_binders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_binder.get_binders(db, skip=skip, limit=limit)

@router.get("/{binder_id}", response_model=schemas.BinderResponse)
def read_binder(binder_id: int, db: Session = Depends(get_db)):
    db_binder = crud_binder.get_binder(db, binder_id=binder_id)
    if db_binder is None:
        raise HTTPException(status_code=404, detail="Binder not found")
    return db_binder

@router.put("/{binder_id}", response_model=schemas.BinderResponse)
def update_binder(binder_id: int, binder_update: schemas.BinderUpdate, db: Session = Depends(get_db)):
    db_binder = crud_binder.update_binder(db, binder_id, binder_update)
    if db_binder is None:
        raise HTTPException(status_code=404, detail="Binder not found")
    return db_binder

@router.delete("/{binder_id}")
def delete_binder(binder_id: int, db: Session = Depends(get_db)):
    db_binder = crud_binder.delete_binder(db, binder_id)
    if db_binder is None:
        raise HTTPException(status_code=404, detail="Binder not found")
    return {"detail": "Binder deleted successfully"}

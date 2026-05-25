from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, models
from app.crud import crud_binder
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/binders",
    tags=["binders"],
)

@router.post("/", response_model=schemas.BinderResponse, status_code=status.HTTP_201_CREATED)
def create_binder(
    binder: schemas.BinderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud_binder.create_binder(db=db, binder=binder, owner_id=current_user.id)

@router.get("/", response_model=List[schemas.BinderResponse])
def read_binders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud_binder.get_user_binders(db, owner_id=current_user.id, skip=skip, limit=limit)

@router.get("/{binder_id}", response_model=schemas.BinderResponse)
def read_binder(
    binder_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_binder = crud_binder.get_binder(db, binder_id=binder_id)
    if db_binder is None:
        raise HTTPException(status_code=404, detail="Binder not found")
    if db_binder.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this binder")
    return db_binder

@router.put("/{binder_id}", response_model=schemas.BinderResponse)
def update_binder(
    binder_id: int,
    binder_update: schemas.BinderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_binder = crud_binder.get_binder(db, binder_id=binder_id)
    if db_binder is None:
        raise HTTPException(status_code=404, detail="Binder not found")
    if db_binder.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this binder")
    return crud_binder.update_binder(db, binder_id, binder_update)

@router.delete("/{binder_id}")
def delete_binder(
    binder_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_binder = crud_binder.get_binder(db, binder_id=binder_id)
    if db_binder is None:
        raise HTTPException(status_code=404, detail="Binder not found")
    if db_binder.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this binder")
    crud_binder.delete_binder(db, binder_id)
    return {"detail": "Binder deleted successfully"}

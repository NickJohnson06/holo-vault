from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas
from app.crud import crud_page, crud_binder
from app.database import get_db

router = APIRouter(
    prefix="/pages",
    tags=["pages"],
)

@router.post("/", response_model=schemas.PageResponse)
def create_page(page: schemas.PageCreate, db: Session = Depends(get_db)):
    # Verify the parent binder actual exists before creating a page for it
    db_binder = crud_binder.get_binder(db, page.binder_id)
    if not db_binder:
         raise HTTPException(status_code=404, detail="Parent Binder not found")
    return crud_page.create_page(db=db, page=page)

@router.get("/binder/{binder_id}", response_model=List[schemas.PageResponse])
def read_pages_for_binder(binder_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_page.get_pages_for_binder(db, binder_id=binder_id, skip=skip, limit=limit)

@router.get("/{page_id}", response_model=schemas.PageResponse)
def read_page(page_id: int, db: Session = Depends(get_db)):
    db_page = crud_page.get_page(db, page_id=page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@router.put("/{page_id}", response_model=schemas.PageResponse)
def update_page(page_id: int, page_update: schemas.PageUpdate, db: Session = Depends(get_db)):
    db_page = crud_page.update_page(db, page_id, page_update)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@router.delete("/{page_id}")
def delete_page(page_id: int, db: Session = Depends(get_db)):
    db_page = crud_page.delete_page(db, page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"detail": "Page deleted successfully"}

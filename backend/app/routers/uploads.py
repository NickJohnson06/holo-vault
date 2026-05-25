from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import uuid
import datetime

from app import models
from app.utils.s3 import upload_file_to_s3
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/uploads",
    tags=["uploads"],
)

@router.post("/image")
def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload an image to AWS S3 and return the public URL.
    Uses UUID to ensure unique filenames.
    """
    # Quick superficial validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate a unique filename using UUID and maintaining extension
    extension = file.filename.split(".")[-1] if "." in file.filename else "png"
    unique_filename = f"cards/{datetime.datetime.now().strftime('%Y%m%d')}/{uuid.uuid4()}.{extension}"

    try:
        url = upload_file_to_s3(file.file, unique_filename, file.content_type)
        return {"url": url, "filename": unique_filename}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

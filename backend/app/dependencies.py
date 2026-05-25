from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.crud import crud_user
from app.utils.auth import SECRET_KEY, ALGORITHM

# The endpoint used by OpenAPI / Swagger for retrieving tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> models.User:
    """
    Extracts and validates a JWT token from the Authorization header.
    Returns the authenticated User database object.
    Raises 401 Unauthorized if validation or decoding fails.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = crud_user.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

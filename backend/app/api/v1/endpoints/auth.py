# app/api/v1/endpoints/auth.py
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.auth import authenticate_user, get_current_active_user  # Add this import
from app.core.security import create_access_token
from app.schemas.token import Token
from app.models.user import User  # Add this import
from app.core.database import get_db
from app.config.settings import get_settings
import logging

settings = get_settings()
router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/login", response_model=Token)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Inactive user"
        )
        
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    return {
        "access_token": create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        ),
        "token_type": "bearer"
    }

@router.post("/test-token")
async def test_token(current_user: User = Depends(get_current_active_user)) -> Any:
    """
    Test access token
    """
    return {"email": current_user.email, "msg": "Token is valid"}
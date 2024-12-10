# app/api/v1/endpoints/auth.py
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.auth import authenticate_user, get_current_active_user
from app.core.security import create_access_token
from app.schemas.token import Token
from app.schemas.user import User as UserSchema  # Import the User schema
from app.models.user import User  # Import the User model
from app.core.database import get_db
from app.config.settings import get_settings

settings = get_settings()
router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
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
            subject={"sub": str(user.id)},
            expires_delta=access_token_expires
        ),
        "token_type": "bearer"
    }

@router.post("/test-token", response_model=UserSchema)
def test_token(current_user: User = Depends(get_current_active_user)) -> Any:
    """Test access token"""
    return current_user
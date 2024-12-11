import logging
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema, UserUpdate
from app.core.security import get_password_hash
from app.core.auth import get_current_active_superuser, get_current_active_user
from app.config.settings import get_settings
import pytz

settings = get_settings()
logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/init-superuser", response_model=UserSchema)
async def create_init_superuser(
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create initial superuser. This endpoint should be disabled after first use.
    """
    try:
        # Check if any user exists
        user_exists = db.query(User).first()
        if user_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Initial superuser can only be created when no users exist"
            )
        
        # Create superuser
        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            timezone="UTC",  # Default timezone
            news_generation_hour_1=6,  # Default 6 AM
            news_generation_hour_2=18,  # Default 6 PM
            is_active=True,
            is_superuser=True  # Force superuser
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"Created initial superuser: {user.email}")
        return user
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating superuser: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. User might already exist."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating superuser: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating superuser"
        )

@router.post("/", response_model=UserSchema)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Create new user. Only superusers can create new users.
    """
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate timezone if provided
        timezone = user_in.timezone if user_in.timezone else "UTC"
        if timezone not in pytz.all_timezones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid timezone"
            )
        
        # Create new user
        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            timezone=timezone,
            news_generation_hour_1=user_in.news_generation_hour_1 if user_in.news_generation_hour_1 is not None else 6,
            news_generation_hour_2=user_in.news_generation_hour_2 if user_in.news_generation_hour_2 is not None else 18,
            is_active=user_in.is_active,
            is_superuser=user_in.is_superuser
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"Created new user: {user.email}")
        return user
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Username might already exist."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update current user.
    """
    try:
        # Update password if provided
        if user_in.password is not None:
            current_user.hashed_password = get_password_hash(user_in.password)
        
        # Update email if provided
        if user_in.email is not None:
            current_user.email = user_in.email
        
        # Update username if provided
        if user_in.username is not None:
            current_user.username = user_in.username
            
        # Update timezone if provided
        if user_in.timezone is not None:
            if user_in.timezone not in pytz.all_timezones:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid timezone"
                )
            current_user.timezone = user_in.timezone
            
        # Update news generation hours if provided
        if user_in.news_generation_hour_1 is not None:
            if not 0 <= user_in.news_generation_hour_1 <= 23:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="News generation hour 1 must be between 0 and 23"
                )
            current_user.news_generation_hour_1 = user_in.news_generation_hour_1
            
        if user_in.news_generation_hour_2 is not None:
            if not 0 <= user_in.news_generation_hour_2 <= 23:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="News generation hour 2 must be between 0 and 23"
                )
            current_user.news_generation_hour_2 = user_in.news_generation_hour_2
        
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Updated user: {current_user.email}")
        return current_user
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error updating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error. Email or username might already exist."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )

@router.get("/timezones", response_model=List[str])
async def list_available_timezones() -> Any:
    """
    Get list of available timezones.
    """
    return pytz.all_timezones

@router.get("/{user_id}", response_model=UserSchema)
async def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Get user by ID. Only for superusers.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/", response_model=List[UserSchema])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Retrieve users. Only for superusers.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Delete user. Only for superusers.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        db.delete(user)
        db.commit()
        logger.info(f"Deleted user: {user.email}")
        return {"status": "success", "message": f"User {user.email} deleted"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        )
# app/api/v1/endpoints/users.py
import logging
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema, UserUpdate
from app.core.security import get_password_hash
from app.core.auth import get_current_active_superuser, get_current_active_user
from app.config.settings import get_settings

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
        
        # Create new user
        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
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
        if user_in.password is not None:
            current_user.hashed_password = get_password_hash(user_in.password)
        if user_in.email is not None:
            current_user.email = user_in.email
        if user_in.username is not None:
            current_user.username = user_in.username
        
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
) -> None:
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
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        )
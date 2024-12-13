# app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt  # Changed from jose.jwt
from pydantic import ValidationError
from datetime import datetime
from app.core.security import verify_password, verify_token
from app.core.database import get_db
from app.models.user import User
from app.schemas.token import TokenPayload
from app.config.settings import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False  # Changed to False to support optional authentication
)

def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> Optional[User]:
    """
    Authenticate a user with email and password.
    Returns None if authentication fails.
    """
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.info(f"Authentication failed: User not found with email {email}")
            return None
            
        if not verify_password(password, user.hashed_password):
            logger.info(f"Authentication failed: Invalid password for user {email}")
            return None
            
        logger.info(f"User authenticated successfully: {email}")
        return user
        
    except Exception as e:
        logger.error(f"Error during authentication: {str(e)}")
        return None

async def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Get current user from JWT token.
    Returns None if no token or invalid token.
    """
    if not token:
        return None
        
    try:
        # Verify and decode token
        payload = verify_token(token)
        if payload is None:
            logger.warning("Token verification failed")
            return None
        
        # Validate token data
        token_data = TokenPayload(**payload)
        if token_data.exp and datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            logger.warning("Token has expired")
            return None
        
        # Get user
        user = db.query(User).filter(User.id == token_data.sub).first()
        if not user:
            logger.warning(f"User not found for token sub: {token_data.sub}")
            return None
            
        return user
        
    except (jwt.InvalidTokenError, ValidationError) as e:
        logger.error(f"Token validation error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        return None

async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """
    Verify that the current user is active.
    Raises exception if no user or inactive user.
    """
    if not current_user:
        logger.warning("No authenticated user found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not current_user.is_active:
        logger.warning(f"Inactive user attempted access: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_optional_current_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> Optional[User]:
    """
    Similar to get_current_active_user but doesn't raise an exception if no user is found.
    Used for endpoints that support both authenticated and unauthenticated access.
    Only checks if the user is active when a user is present.
    """
    if current_user and not current_user.is_active:
        logger.warning(f"Inactive user attempted optional access: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Verify that the current user is an active superuser.
    """
    if not current_user.is_superuser:
        logger.warning(f"Non-superuser attempted privileged action: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

# Rate limiting helper (optional)
from fastapi import Request
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from collections import defaultdict
import time

# Simple in-memory rate limiting
RATE_LIMIT_DURATION = 60  # seconds
MAX_REQUESTS = 30  # requests per duration
rate_limit_data = defaultdict(list)

async def rate_limit_auth(request: Request):
    """
    Basic rate limiting for authentication endpoints.
    """
    client_ip = request.client.host
    now = time.time()
    
    # Clean old requests
    rate_limit_data[client_ip] = [
        req_time for req_time in rate_limit_data[client_ip]
        if req_time > now - RATE_LIMIT_DURATION
    ]
    
    # Check rate limit
    if len(rate_limit_data[client_ip]) >= MAX_REQUESTS:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again later."
        )
    
    # Add new request
    rate_limit_data[client_ip].append(now)

async def get_optional_current_user_public(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Like get_optional_current_user but never raises auth errors.
    Used for public endpoints.
    """
    try:
        return await get_optional_current_user(request, db)
    except:
        return None
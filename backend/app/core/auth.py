# app/core/auth.py
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
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

# Define public routes that don't require authentication
PUBLIC_PATHS = [
    "/api/v1/prompts/public",
    "/api/v1/prompts/by-path",
    "/api/v1/prompts/templates",
    "/api/v1/news/public",  # Added public news endpoint
    "/api/v1/news/public/latest",  # Added public latest news endpoint
    "/api/v1/news/by-prompt",  # Added endpoint to get news by prompt path
    "/api/v1/news/by-path"  # Added endpoint to get news by prompt path
]

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False  # Do not auto-error on missing token
)

def is_public_path(path: str) -> bool:
    """Check if the given path is a public route."""
    return any(path.startswith(route) for route in PUBLIC_PATHS)

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
    request: Request,
    current_user: Optional[User] = Depends(get_current_user)
) -> Optional[User]:
    """
    Optional authentication that allows public access.
    Used for endpoints that support both authenticated and unauthenticated access.
    """
    if is_public_path(request.url.path):
        return current_user
        
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

async def public_route_optional_auth(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Public route dependency that allows optional authentication."""
    try:
        if not is_public_path(request.url.path):
            return None
        token = await oauth2_scheme(request)
        if not token:
            return None
        return await get_current_user(db, token)
    except:
        return None

# Rate limiting helper
from collections import defaultdict
import time

# Simple in-memory rate limiting
RATE_LIMIT_DURATION = 60  # seconds
MAX_REQUESTS = 30  # requests per duration
PUBLIC_MAX_REQUESTS = 60  # Higher limit for public endpoints
rate_limit_data = defaultdict(list)

async def rate_limit_auth(request: Request):
    """
    Basic rate limiting with different limits for public/private routes.
    """
    client_ip = request.client.host
    now = time.time()
    is_public = is_public_path(request.url.path)
    max_requests = PUBLIC_MAX_REQUESTS if is_public else MAX_REQUESTS
    
    # Clean old requests
    rate_limit_data[client_ip] = [
        req_time for req_time in rate_limit_data[client_ip]
        if req_time > now - RATE_LIMIT_DURATION
    ]
    
    # Check rate limit
    if len(rate_limit_data[client_ip]) >= max_requests:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )
    
    # Add new request
    rate_limit_data[client_ip].append(now)
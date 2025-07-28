from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.config import settings
from app.core.security import ALGORITHM
from app.services import user_service
from app.utils.db import get_db
from app.utils.supabase import get_supabase_client

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

supabase = get_supabase_client()


async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> models.User:
    """
    Get current user from token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # First try to decode with our app secret
        try:
            # Decode token using our SECRET_KEY
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[ALGORITHM]
            )
            token_data = schemas.TokenPayload(**payload)
            # Get user from database using UUID
            user = user_service.get_user(db, id=token_data.sub)
        except (jwt.JWTError, ValidationError):
            # If our app token fails, try Supabase token
            try:
                # Verify token with Supabase
                supabase_user = supabase.auth.get_user(token)
                supabase_uid = supabase_user.user.id
                
                # Get user from database using Supabase UID
                user = user_service.get_user_by_supabase_uid(db, supabase_uid=supabase_uid)
                if not user:
                    # This is a valid Supabase user but not in our DB yet
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User exists in Supabase but not in application database",
                    )
            except Exception:
                # Both token validation methods failed
                raise credentials_exception
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return user
            
    except Exception:
        raise credentials_exception


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Get current active user
    """
    if not user_service.is_active(current_user):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_admin_user(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    """
    Get current admin user
    """
    if not user_service.is_admin(current_user):
        raise HTTPException(
            status_code=401,
            detail="The user doesn't have enough privileges",
        )
    return current_user


async def get_supabase_client_from_request(request: Request):
    """
    Get Supabase client with user's session if available
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            # Attempt to set the auth token for the Supabase client
            # This allows direct calls to Supabase services with user's auth
            supabase.auth.set_session(token)
            return supabase
        except Exception:
            pass
    
    # Return unauthenticated client
    return supabase

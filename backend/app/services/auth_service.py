from typing import Optional
from fastapi import HTTPException, status
from app.utils.supabase import get_supabase_client
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.services.user_service import get_user_by_email, create_user, update_last_login
from app.schemas.user import UserCreate
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from uuid import UUID

supabase = get_supabase_client()


async def register_user(db: Session, user_in: UserCreate):
    """
    Register a new user using Supabase Auth and database
    """
    # Check if password matches confirmation
    if user_in.password != user_in.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords don't match",
        )
    
    # Check if user already exists
    existing_user = get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    
    try:
        # Register user in Supabase Auth
        supabase_response = supabase.auth.sign_up({
            "email": user_in.email,
            "password": user_in.password,
            "options": {
                "data": {
                    "first_name": user_in.first_name,
                    "last_name": user_in.last_name,
                }
            }
        })
        
        # Get Supabase UID
        supabase_uid = supabase_response.user.id
        
        # Create user in our database
        db_user = create_user(
            db=db, 
            obj_in=user_in,
            supabase_uid=supabase_uid
        )
        
        return db_user
        
    except Exception as e:
        # Handle errors from Supabase
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error registering user: {str(e)}",
        )


async def login_user(db: Session, email: str, password: str):
    """
    Authenticate a user using Supabase Auth
    """
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        
        # Get user from our database
        db_user = get_user_by_email(db, email=email)
        if not db_user:
            # This should not happen normally, but if it does, create the user in our DB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User exists in Supabase but not in application database",
            )
        
        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        
        # Update last login time
        update_last_login(db, user=db_user)
        
        # Create our own JWT tokens for API usage
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            db_user.id, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(db_user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": db_user
        }
        
    except Exception as e:
        # Handle authentication errors, include Supabase error for debugging
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect email or password: {str(e)}",
        )


async def refresh_auth_token(db: Session, refresh_token: str):
    """
    Refresh authentication token
    """
    from jose import jwt, JWTError
    from app.core.security import ALGORITHM
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode token
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # Check if token has refresh claim
        if not payload.get("refresh"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid refresh token",
            )
        
        # Create new tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            user_id, expires_delta=access_token_expires
        )
        new_refresh_token = create_refresh_token(user_id)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
        
    except JWTError:
        raise credentials_exception

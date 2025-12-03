from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.utils.supabase import get_supabase_client
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.services.user_service import get_user_by_email, create_user, update_last_login
from app.schemas.user import UserCreate
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from jose import jwt, JWTError
from app.core.security import ALGORITHM

# Setup logging
logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase = get_supabase_client()

# Rate limiting settings
login_attempts: Dict[str, Dict[str, Any]] = {}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_TIME = 300  # 5 minutes in seconds

def check_rate_limit(email: str) -> None:
    """
    Check if login attempts should be rate limited
    """
    now = datetime.utcnow()
    user_attempts = login_attempts.get(email, {"count": 0, "lockout_until": None})
    
    # Check if user is in lockout period
    if user_attempts["lockout_until"] and now < user_attempts["lockout_until"]:
        time_left = (user_attempts["lockout_until"] - now).seconds
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Try again in {time_left} seconds"
        )
    
    # Reset attempts if lockout period has passed
    if user_attempts["lockout_until"] and now >= user_attempts["lockout_until"]:
        user_attempts = {"count": 0, "lockout_until": None}
    
    login_attempts[email] = user_attempts

def update_login_attempts(email: str, success: bool) -> None:
    """
    Update login attempts counter
    """
    if success:
        # Reset on successful login
        login_attempts.pop(email, None)
        return

    user_attempts = login_attempts.get(email, {"count": 0, "lockout_until": None})
    user_attempts["count"] += 1
    
    if user_attempts["count"] >= MAX_LOGIN_ATTEMPTS:
        user_attempts["lockout_until"] = datetime.utcnow() + timedelta(seconds=LOCKOUT_TIME)
    
    login_attempts[email] = user_attempts


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
        logger.info(f"Attempting to register user with email: {user_in.email}")

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

        logger.info(f"Supabase registration response: {supabase_response}")

        # Check if registration was successful
        if not supabase_response.user:
            logger.error(f"Supabase registration failed - no user returned: {supabase_response}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed - please check your email format and try again",
            )

        # Get Supabase UID
        supabase_uid = supabase_response.user.id
        logger.info(f"Supabase user created with UID: {supabase_uid}")

        # Create user in our database
        db_user = create_user(
            db=db,
            obj_in=user_in,
            supabase_uid=supabase_uid
        )

        logger.info(f"Database user created with ID: {db_user.id}")
        return db_user

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle errors from Supabase with detailed logging
        logger.error(f"Supabase registration error for {user_in.email}: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error registering user: {str(e)}",
        )


async def login_user(db: Session, email: str, password: str):
    """
    Authenticate a user using Supabase Auth with rate limiting
    """
    try:
        logger.info(f"Login attempt for email: {email}")

        # Check rate limiting
        check_rate_limit(email)

        # Authenticate with Supabase
        logger.info(f"Attempting Supabase authentication for: {email}")
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })

        logger.info(f"Supabase auth response: {auth_response}")

        # Check if authentication was successful
        if not auth_response.user:
            logger.warning(f"Supabase authentication failed - no user returned for: {email}")
            update_login_attempts(email, success=False)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Get user from our database
        db_user = get_user_by_email(db, email=email)
        if not db_user:
            logger.error(f"User exists in Supabase but not in application database: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account not properly set up. Please contact support.",
            )
        
        if not db_user.is_active:
            logger.warning(f"Login attempt for inactive user: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is inactive. Please contact support.",
            )
        
        # Update last login time and reset login attempts
        update_last_login(db, user=db_user)
        update_login_attempts(email, success=True)
        
        # Create tokens
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
        
    except HTTPException as http_exc:
        # Re-raise HTTPException to preserve status code and details
        raise http_exc
    except Exception as e:
        # Log the full error for debugging, but return a generic error to the user
        logger.error(f"An unexpected error occurred during login for {email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed. Please check your credentials or contact support.",
        )


async def refresh_auth_token(db: Session, refresh_token: str):
    """
    Refresh authentication token with improved security and logging
    """
    try:
        # Decode token
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("Refresh token missing user ID")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        # Check if token has refresh claim
        if not payload.get("refresh"):
            logger.warning(f"Invalid refresh token used for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid refresh token",
            )
        
        # Verify token expiration
        exp = payload.get("exp")
        if not exp or datetime.utcfromtimestamp(exp) < datetime.utcnow():
            logger.warning(f"Expired refresh token used for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired",
            )
        
        # Create new tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            user_id, expires_delta=access_token_expires
        )
        new_refresh_token = create_refresh_token(user_id)
        
        logger.info(f"Successfully refreshed tokens for user {user_id}")
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
        
    except JWTError as e:
        logger.error(f"JWT error during token refresh: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while refreshing the token",
        )

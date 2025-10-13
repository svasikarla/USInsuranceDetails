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
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)

supabase = get_supabase_client()


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme)
) -> models.User:
    """
    Get current user from token in Authorization header or HttpOnly cookie
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Attempt to read from cookie if no bearer token provided
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise credentials_exception

    try:
        # First try to decode with our app secret
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            token_data = schemas.TokenPayload(**payload)
            user = user_service.get_user(db, id=token_data.sub)
        except (jwt.JWTError, ValidationError):
            # If our app token fails, try Supabase token
            try:
                supabase_user = supabase.auth.get_user(token)
                supabase_uid = supabase_user.user.id
                user = user_service.get_user_by_supabase_uid(db, supabase_uid=supabase_uid)
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User exists in Supabase but not in application database",
                    )
            except Exception:
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
    Get Supabase client. Avoid attempting to set session with non-Supabase tokens.
    If you need user-scoped Supabase calls, validate a real Supabase JWT and set session explicitly.
    """
    return supabase

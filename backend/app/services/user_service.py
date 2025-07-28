from typing import Any, Dict, Optional, Union
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from app import models, schemas
from app.core.security import get_password_hash, verify_password
from app.utils.supabase import get_supabase_client

supabase = get_supabase_client()


def get_user(db: Session, id: str) -> Optional[models.User]:
    """
    Get user by ID
    """
    return db.query(models.User).filter(models.User.id == id).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    Get user by email
    """
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_supabase_uid(db: Session, supabase_uid: str) -> Optional[models.User]:
    """
    Get user by Supabase UID
    """
    return db.query(models.User).filter(models.User.supabase_uid == supabase_uid).first()


def create_user(db: Session, obj_in: schemas.UserCreate, supabase_uid: str = None) -> models.User:
    """
    Create new user
    """
    db_obj = models.User(
        id=uuid.uuid4(),
        email=obj_in.email,
        password_hash=get_password_hash(obj_in.password),
        first_name=obj_in.first_name,
        last_name=obj_in.last_name,
        company_name=obj_in.company_name,
        role="user",
        subscription_tier="free",
        is_active=True,
        email_verified=False,
        supabase_uid=supabase_uid
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def authenticate(db: Session, *, email: str, password: str) -> Optional[models.User]:
    """
    Authenticate user by email and password (legacy method)
    """
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_last_login(db: Session, *, user: models.User) -> models.User:
    """
    Update user's last login timestamp
    """
    user.last_login_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(
    db: Session, *, user: models.User, obj_in: Union[schemas.UserUpdate, Dict[str, Any]], sync_with_supabase: bool = True
) -> models.User:
    """
    Update user
    """
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
        
    # Don't allow updating role or subscription_tier directly
    update_data.pop("role", None)
    update_data.pop("subscription_tier", None)
    
    # Handle password update
    if "password" in update_data:
        password = update_data["password"]
        hashed_password = get_password_hash(password)
        update_data["password_hash"] = hashed_password
        del update_data["password"]
        
        # Update password in Supabase if we have the UID
        if sync_with_supabase and user.supabase_uid:
            try:
                admin_client = supabase.auth.admin
                admin_client.update_user_by_id(
                    user.supabase_uid,
                    {"password": password}
                )
            except Exception as e:
                print(f"Error updating Supabase password: {str(e)}")
    
    # Update email in Supabase if it's being changed
    if "email" in update_data and sync_with_supabase and user.supabase_uid:
        try:
            new_email = update_data["email"]
            admin_client = supabase.auth.admin
            admin_client.update_user_by_id(
                user.supabase_uid,
                {"email": new_email}
            )
        except Exception as e:
            print(f"Error updating Supabase email: {str(e)}")
    
    # Update user in database
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    
    # Update timestamp
    user.updated_at = datetime.utcnow()
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def is_active(user: models.User) -> bool:
    """
    Check if user is active
    """
    return user.is_active


def is_admin(user: models.User) -> bool:
    """
    Check if user is admin
    """
    return user.role == "admin"

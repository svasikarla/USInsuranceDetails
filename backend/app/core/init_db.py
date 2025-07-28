import uuid
from sqlalchemy.orm import Session
from datetime import datetime

from app import models
from app.core.security import get_password_hash
from app.utils.supabase import get_supabase_client

supabase = get_supabase_client()


def init_db(db: Session) -> None:
    """
    Initialize the database with default data
    """
    # Create admin user if it doesn't exist
    user = db.query(models.User).filter(models.User.email == "admin@example.com").first()
    if not user:
        admin_id = uuid.uuid4()
        admin_password = "adminpassword"
        
        # Create in Supabase Auth
        try:
            supabase_response = supabase.auth.admin.create_user({
                "email": "admin@example.com",
                "password": admin_password,
                "email_confirm": True,
                "user_metadata": {
                    "first_name": "Admin",
                    "last_name": "User",
                    "role": "admin"
                }
            })
            supabase_uid = supabase_response.user.id
            print(f"Supabase admin user created with UID: {supabase_uid}")
        except Exception as e:
            print(f"Failed to create Supabase admin user: {str(e)}")
            print("Continuing with local DB initialization only")
            supabase_uid = None
        
        admin = models.User(
            id=admin_id,
            email="admin@example.com",
            password_hash=get_password_hash(admin_password),
            first_name="Admin",
            last_name="User",
            company_name="US Insurance Details",
            role="admin",
            subscription_tier="enterprise",
            is_active=True,
            email_verified=True,
            supabase_uid=supabase_uid,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(admin)
        db.commit()
        print("Admin user created in local database")
    
    # Create default insurance carriers
    carriers = [
        {"name": "Blue Cross Blue Shield", "code": "bcbs"},
        {"name": "UnitedHealthcare", "code": "uhc"},
        {"name": "Aetna", "code": "aetna"},
        {"name": "Cigna", "code": "cigna"},
        {"name": "Humana", "code": "humana"},
        {"name": "Kaiser Permanente", "code": "kaiser"}
    ]
    
    for carrier_data in carriers:
        carrier = (
            db.query(models.InsuranceCarrier)
            .filter(models.InsuranceCarrier.code == carrier_data["code"])
            .first()
        )
        
        if not carrier:
            carrier = models.InsuranceCarrier(
                id=uuid.uuid4(),
                name=carrier_data["name"],
                code=carrier_data["code"],
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(carrier)
            db.commit()
            print(f"Carrier created: {carrier_data['name']}")


if __name__ == "__main__":
    from app.utils.db import SessionLocal, engine
    from app.models.base import Base
    
    # Create tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Initialize data
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()

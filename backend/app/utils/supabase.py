from supabase import create_client
from app.core.config import settings

# Create Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_supabase_client():
    """
    Get Supabase client instance
    """
    return supabase

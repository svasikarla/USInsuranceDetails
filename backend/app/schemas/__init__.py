"""
API schemas using Pydantic for request/response validation
"""

# User schemas
from .user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDBBase,
    User,
    UserInDB
)

# Token schemas
from .token import (
    Token,
    TokenWithUser,
    TokenPayload,
    TokenData
)

# Document schemas
from .document import *

# Policy schemas
from .policy import *

# Benefit schemas
from .benefit import *

# Red flag schemas
from .red_flag import *

# Carrier schemas
from .carrier import *

# Dashboard schemas
from .dashboard import *

# Rebuild models with forward references after all imports
from .dashboard import CompleteDashboardData
from .policy import CompletePolicyData
from .document import CompleteDocumentData

# Rebuild models to resolve forward references
CompleteDashboardData.model_rebuild()
CompletePolicyData.model_rebuild()
CompleteDocumentData.model_rebuild()

from pydantic import BaseModel
from typing import Optional
from .user import User


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenWithUser(Token):
    user: User


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


class TokenData(BaseModel):
    user_id: str

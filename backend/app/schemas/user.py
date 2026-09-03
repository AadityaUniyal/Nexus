from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, computed_field

class Token(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    access_token: str
    token_type: str = "bearer"
    user: "UserRead"

    @computed_field
    @property
    def accessToken(self) -> str:
        return self.access_token

    @computed_field
    @property
    def tokenType(self) -> str:
        return self.token_type

class TokenPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    sub: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    email: EmailStr
    password: str

class UserBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    email: EmailStr
    name: str
    role: str = "OPERATOR"
    department: Optional[str] = None
    is_active: bool = Field(True, alias="isActive")

class UserCreate(UserBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    password: str
    workspace_id: str = Field(..., alias="workspaceId")

class UserUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = Field(None, alias="isActive")
    password: Optional[str] = None

class UserRoleUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    role: str

class UserRead(UserBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")

Token.model_rebuild()

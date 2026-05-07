from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    id: int
    username: str
    display_name: str
    role: str
    permissions: list[str]


class LoginResponse(BaseModel):
    token: str
    user: UserPublic

from fastapi import APIRouter, Depends, HTTPException

from app.auth import current_user, require_permission, token_from_header
from app.models.auth import LoginRequest, LoginResponse, UserPublic
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    result = auth_service.login(body.username, body.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return result


@router.get("/me", response_model=UserPublic)
def me(user: dict = Depends(current_user)):
    return user


@router.get("/assignees", response_model=list[UserPublic])
def assignees(user: dict = Depends(require_permission("suspected_incidents:assign"))):
    return auth_service.list_assignable_users()


@router.post("/logout")
def logout(token: str | None = Depends(token_from_header)):
    return auth_service.logout(token)

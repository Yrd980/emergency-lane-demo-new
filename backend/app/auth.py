from fastapi import Depends, Header, HTTPException

from app.services import auth_service
from app.services.settings_service import get_device_access_mode


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def current_user(authorization: str | None = Header(default=None)):
    user = auth_service.get_user_by_token(_bearer_token(authorization))
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def optional_user(authorization: str | None = Header(default=None)):
    return auth_service.get_user_by_token(_bearer_token(authorization))


def require_permission(permission: str):
    def dependency(user: dict = Depends(current_user)):
        if not auth_service.has_permission(user, permission):
            raise HTTPException(status_code=403, detail="Permission denied")
        return user
    return dependency


def require_device_access(authorization: str | None = Header(default=None)):
    if get_device_access_mode() == "open":
        return None
    user = auth_service.get_user_by_token(_bearer_token(authorization))
    if not user:
        raise HTTPException(status_code=401, detail="Device token required")
    return user


def token_from_header(authorization: str | None = Header(default=None)):
    return _bearer_token(authorization)

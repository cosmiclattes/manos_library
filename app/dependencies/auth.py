from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, UserType
from app.schemas.schemas import TokenData
from app.config import get_settings
from typing import Optional

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


def get_token_from_cookie_or_header(
    request: Request,
    token_from_header: Optional[str] = Depends(oauth2_scheme)
) -> str:
    """Get token from cookie or Authorization header"""
    # First, try to get from Authorization header
    if token_from_header:
        return token_from_header

    # If not in header, try to get from cookie
    token_from_cookie = request.cookies.get("access_token")
    if token_from_cookie:
        # Cookie stores "Bearer <token>", extract just the token
        if token_from_cookie.startswith("Bearer "):
            return token_from_cookie[7:]
        return token_from_cookie

    # No token found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Please login.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: str = Depends(get_token_from_cookie_or_header),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


def require_librarian(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_type not in [UserType.LIBRARIAN, UserType.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Librarian access required."
        )
    return current_user

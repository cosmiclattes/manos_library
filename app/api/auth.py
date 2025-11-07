from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from jose import jwt
from datetime import datetime, timedelta
from app.database import get_db
from app.models.models import User, UserType
from app.schemas.schemas import Token, UserResponse
from app.config import get_settings
from app.dependencies.auth import get_current_user

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


@router.get("/login/google")
async def login_google(request: Request):
    redirect_uri = f"{settings.APP_URL}/auth/callback/google"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback/google")
async def auth_callback_google(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )

        email = user_info.get('email')
        name = user_info.get('name')
        google_id = user_info.get('sub')

        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                user_type=UserType.MEMBER
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if not user.google_id:
                user.google_id = google_id
                db.commit()

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return current_user

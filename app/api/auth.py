from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from app.core.database import get_db
from app.core import security
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Dependency to get current user context
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    email = security.decode_access_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/auth/register", response_model=UserOut)
@router.post("/api/auth/register", response_model=UserOut)
@router.post("/register", response_model=UserOut)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check duplicate
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = security.get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_pwd,
        full_name=user_data.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/auth/login")
@router.post("/api/auth/login")
@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not security.verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access = security.create_access_token(subject=user.email)
    refresh = security.create_refresh_token(subject=user.email)
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": user
    }

@router.post("/auth/refresh")
def refresh_token(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    email = security.decode_refresh_token(payload.refresh_token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    access = security.create_access_token(subject=user.email)
    return {
        "access_token": access,
        "token_type": "bearer"
    }

@router.get("/auth/profile", response_model=UserOut)
@router.get("/api/auth/me", response_model=UserOut)
@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user)):
    # Standard JWT token blacklist / logout stub
    return {"message": "Successfully logged out from session."}

@router.post("/auth/password-reset")
def request_password_reset(payload: PasswordResetRequest):
    # Password reset transaction request stub
    return {"message": f"Password reset email dispatched to {payload.email} if registered."}

@router.post("/auth/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm):
    # Password reset confirmation update stub
    return {"message": "New credentials saved successfully."}

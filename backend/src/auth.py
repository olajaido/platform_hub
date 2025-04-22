from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel
import os

from dotenv import load_dotenv
from passlib.context import CryptContext
from src.supabase import get_user_by_username

# Load environment variables
load_dotenv()

# Security settings from environment variables
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-secret-key-not-for-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# For development purposes only - warn if using default secret key
if SECRET_KEY == "development-secret-key-not-for-production":
    print("WARNING: Using default JWT secret key. Set JWT_SECRET_KEY environment variable for production.")

# Password context for hashing and verification
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token schema
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User schema
class User(BaseModel):
    username: str
    email: Optional[str] = None
    role: str

class UserInDB(User):
    password: str

# OAuth2 password bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

# JWT functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str) -> Optional[Dict[str, Any]]:
    """Get user from Supabase database"""
    # Try to get user from Supabase
    user = get_user_by_username(username)
    if user:
        return user
    
    # For development purposes only - provide a default admin user
    if username == "admin" and SECRET_KEY == "development-secret-key-not-for-production":
        print("WARNING: Using default admin user. This should only be used for development.")
        return {
            "username": "admin",
            "email": "admin@example.com",
            "password": pwd_context.hash("admin"),  # Default password: admin
            "role": "admin"
        }
    
    return None

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate user against Supabase database"""
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user["password"]):
        return None
    return user

def verify_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    return token_data

def get_current_user(token_data: TokenData = Depends(verify_token)):
    user = get_user(token_data.username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return User(
        username=user["username"],
        email=user["email"],
        role=user["role"]
    )
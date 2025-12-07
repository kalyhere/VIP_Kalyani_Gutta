from fastapi import APIRouter, Depends, HTTPException, status, Security, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, SecurityScopes
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from passlib.context import CryptContext
import os
import traceback
from pydantic import BaseModel
import structlog

from . import models, schemas
from .database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

# Use environment variables for sensitive data
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is not set. Please set it in your .env file.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    scopes: List[str] = []

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="api/auth/login",
    scopes={"admin": "Full access to admin features"}
)

# Password hashing with better security settings
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Increased rounds for better security
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password_val: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password_val)

def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=expires_delta if expires_delta else ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),  # Issued at time
        "type": "access"  # Token type for additional security
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

async def get_current_user(
    security_scopes: SecurityScopes,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> models.User:
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise credentials_exception
        token_scopes = payload.get("scopes", [])
        token_data = TokenData(email=email, scopes=token_scopes)
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if not user:
        raise credentials_exception

    # Verify required scopes
    for scope in security_scopes.scopes:
        if scope not in token_data.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
                headers={"WWW-Authenticate": authenticate_value},
            )

    return user

async def get_current_active_user(
    current_user: models.User = Security(get_current_user, scopes=[])
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Get logger
logger = structlog.get_logger()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        logger.info("Login attempt", email=form_data.username)
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warning("Login failed: Invalid credentials", email=form_data.username)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Include user role-based scopes
        scopes = ["admin"] if user.role == "admin" else []
        
        access_token = create_access_token(
            data={
                "sub": user.email,
                "scopes": scopes,
                "role": user.role
            }
        )
        
        logger.info("Login successful", email=user.email, role=user.role)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    except Exception as e:
        logger.error(
            "Exception during login",
            email=form_data.username,
            error=str(e),
            traceback=traceback.format_exc()
        )
        raise

@router.post("/verify")
async def verify_token(
    request: Request,
    current_user: models.User = Depends(get_current_active_user)
):
    try:
        logger.info("Token verification", email=current_user.email)
        
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "role": current_user.role,
            "permissions": ["admin"] if current_user.role == "admin" else ["user"],
            "isAuthenticated": True
        }
    except Exception as e:
        logger.error(
            "Exception during token verification",
            error=str(e),
            traceback=traceback.format_exc()
        )
        raise

@router.post("/logout")
async def logout(current_user: models.User = Depends(get_current_active_user)):
    # In a stateless JWT setup, we don't need server-side logout
    # Consider implementing token blacklisting for enhanced security
    return {"message": "Successfully logged out"}

@router.get("/validate-invite/{token}")
async def validate_invite_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Validate an invitation token.
    Returns token details if valid, raises HTTPException if not.
    """
    try:
        # Find the invitation
        invitation = db.query(models.UserInvitationToken).filter(
            models.UserInvitationToken.token == token
        ).first()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid invitation token"
            )

        # Check if already used
        if invitation.is_used:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This invitation has already been used"
            )

        # Check if expired
        if invitation.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This invitation has expired"
            )

        # Valid token - return structured response
        return schemas.InviteTokenValidation(
            valid=True,
            email=invitation.email,
            role=invitation.role
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Exception during invitation validation",
            token=token,
            error=str(e),
            traceback=traceback.format_exc()
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while validating the invitation"
        )

@router.post("/register-with-invite/{role_path}")
async def register_with_invite(
    role_path: str,
    registration_data: schemas.UserRegisterWithInvite,
    db: Session = Depends(get_db)
):
    """
    Register a new user with an invitation token.
    The role_path must match the token's role for security.
    """
    try:
        logger.info("Registration attempt with invite", token=registration_data.token, role_path=role_path)

        # Validate the invitation token
        invitation = db.query(models.UserInvitationToken).filter(
            models.UserInvitationToken.token == registration_data.token
        ).first()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid invitation token"
            )

        # Check if already used
        if invitation.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has already been used"
            )

        # Check if expired
        if invitation.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has expired"
            )

        # SECURITY CHECK: role_path must match invitation role
        if invitation.role.value != role_path:
            logger.warning(
                "Role mismatch in registration",
                url_role=role_path,
                token_role=invitation.role.value,
                email=invitation.email
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This invitation is for {invitation.role.value} registration, but you're trying to register as {role_path}"
            )

        # Check if user already exists (shouldn't happen, but double-check)
        existing_user = db.query(models.User).filter(models.User.email == invitation.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        # Create the new user with role FROM TOKEN (not from client input)
        hashed_pw = hash_password(registration_data.password)
        new_user = models.User(
            email=invitation.email,  # From token, not user input
            name=registration_data.name,
            hashed_password=hashed_pw,
            is_active=True,
            role=invitation.role  # FROM TOKEN - source of truth
        )

        db.add(new_user)
        db.flush()  # Get the user ID

        # Mark invitation as used
        invitation.is_used = True
        invitation.used_at = datetime.utcnow()
        invitation.used_by_user_id = new_user.id

        db.commit()
        db.refresh(new_user)

        logger.info(
            "User registration successful",
            email=new_user.email,
            role=new_user.role.value,
            user_id=new_user.id
        )

        return {
            "message": "Registration successful",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "name": new_user.name,
                "role": new_user.role.value
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Exception during registration with invite",
            error=str(e),
            traceback=traceback.format_exc()
        )
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        ) 
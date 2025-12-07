"""Authentication dependencies for suture analysis backend."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os
from typing import Optional, Dict, Any

security = HTTPBearer()

# Use the same JWT configuration as the main backend
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is not set")

ALGORITHM = "HS256"

class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass

class AuthorizationError(Exception):
    """Raised when user lacks required permissions."""
    pass

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify JWT token and return payload.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        Token payload containing user information
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Basic token validation
        if not payload.get("sub"):  # subject (email)
            raise AuthenticationError("Invalid token: missing subject")
            
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token: wrong type")
            
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token_payload: Dict[str, Any] = Depends(verify_token)) -> Dict[str, Any]:
    """
    Get current user information from token payload.
    
    Args:
        token_payload: Decoded JWT token payload
        
    Returns:
        User information dictionary
    """
    return {
        "email": token_payload.get("sub"),
        "role": token_payload.get("role"),
        "scopes": token_payload.get("scopes", [])
    }

def require_admin_role(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Require admin role for accessing the endpoint.
    
    Args:
        user: Current user information
        
    Returns:
        User information if authorized
        
    Raises:
        HTTPException: If user is not an admin
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required for suture analysis access"
        )
    return user

def require_admin_scope(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Require admin scope for accessing the endpoint.
    
    Args:
        user: Current user information
        
    Returns:
        User information if authorized
        
    Raises:
        HTTPException: If user lacks admin scope
    """
    scopes = user.get("scopes", [])
    if "admin" not in scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin scope required for suture analysis access"
        )
    return user
from fastapi import Depends,HTTPException,status
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials

from app.security import verify_internal_token

bearer_scheme = HTTPBearer()

def get_internal_context(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    try:
        payload = verify_internal_token(credentials.credentials)
        return {
                **payload,
                 "_internal_token": credentials.credentials,
        }

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired internal service token"
        )    

        
    
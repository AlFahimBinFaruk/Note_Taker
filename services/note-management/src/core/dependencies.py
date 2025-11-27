from fastapi import HTTPException, Depends,status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .http_client import UserServiceClient

bearer_scheme = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    try:
        token=credentials.credentials
        user_data=await UserServiceClient.validate_token(token)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_data
    except Exception as e:
        raise HTTPException(status_code=status.INTERNAL_SERVER_ERROR, detail=str(e))

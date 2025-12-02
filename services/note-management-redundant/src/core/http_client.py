import httpx
import os
from typing import Optional
from fastapi import HTTPException

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

class UserServiceClient:
    @staticmethod
    async def validate_token(token: str) -> Optional[dict]:
        headers={
            "X-Api-Key": INTERNAL_API_KEY,
            "Content-Type": "application/json",
        }
        payload={"token": token}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{USER_SERVICE_URL}/internal/validate-token",
                    headers=headers,
                    json=payload,
                )

                if response.status_code==200:
                    data=response.json()
                    if data.get("valid"):
                        return {"user_id": data.get("user_id")}
                
                print(f"User service validation failed: {response.status_code} {response.text}")
                return None
        except httpx.RequestError as e:
            print(f"User service validation failed: {e}")
            raise HTTPException(status_code=503, detail=str(e))
import jwt
from jwt import InvalidTokenError

from app.config import (
    AI_SERVICE_JWT_SECRET,
    AI_SERVICE_JWT_ISSUER,
    AI_SERVICE_JWT_AUDIENCE,
)


def verify_internal_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            AI_SERVICE_JWT_SECRET,
            algorithms=["HS256"],
            issuer=AI_SERVICE_JWT_ISSUER,
            audience=AI_SERVICE_JWT_AUDIENCE,
            options={
                "require": [
                    "exp",
                    "iat",
                    "iss",
                    "aud",
                    "sub",
                    "organizationId",
                ]
            },
        )

        return payload

    except InvalidTokenError as error:
        raise ValueError("Invalid internal service token") from error
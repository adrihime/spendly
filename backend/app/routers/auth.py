import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from pydantic import BaseModel

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "gsadriel@gmail.com")
SESSION_SECRET = os.environ.get("SESSION_SECRET", "dev-secret-change-me")
SESSION_COOKIE = "spendly_session"
SESSION_TTL = timedelta(days=7)
COOKIE_SECURE = "https://" in os.environ.get("FRONTEND_ORIGINS", "")

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleLoginRequest(BaseModel):
    credential: str


def require_user(request: Request) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return jwt.decode(token, SESSION_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expired")


@router.post("/google")
def login_with_google(payload: GoogleLoginRequest, response: Response):
    try:
        claims = google_id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = claims.get("email")
    if email != OWNER_EMAIL or not claims.get("email_verified"):
        raise HTTPException(status_code=403, detail="Account not allowed")

    session_token = jwt.encode(
        {
            "sub": email,
            "name": claims.get("name"),
            "picture": claims.get("picture"),
            "exp": datetime.now(timezone.utc) + SESSION_TTL,
        },
        SESSION_SECRET,
        algorithm="HS256",
    )

    response.set_cookie(
        SESSION_COOKIE,
        session_token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=int(SESSION_TTL.total_seconds()),
    )
    return {"email": email, "name": claims.get("name"), "picture": claims.get("picture")}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, samesite="lax", secure=COOKIE_SECURE)
    return {"ok": True}


@router.get("/me")
def me(user: dict = Depends(require_user)):
    return {"email": user["sub"], "name": user.get("name"), "picture": user.get("picture")}

import secrets
import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.core.email import build_confirmation_email, enqueue_email
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest, UserOut

logger = logging.getLogger(__name__)


async def register_user(payload: SignupRequest, db: AsyncSession) -> dict:
    """
    Create a new user, queue a confirmation email, return a simple message.
    Does NOT return a token — user must verify email first.
    """
    # 1. Check duplicate email
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 2. Create user
    verification_token = secrets.token_urlsafe(32)
    user = User(
        first_name=payload.firstName,
        last_name=payload.lastName,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        verification_token=verification_token,
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 3. Queue confirmation email (non-blocking)
    confirm_url = f"{settings.FRONTEND_URL}/auth/verify?token={verification_token}"
    await enqueue_email(
        to=user.email,
        subject="Confirm your Waste2Worth account",
        html_body=build_confirmation_email(user.first_name, confirm_url),
    )

    logger.info("New user registered: %s (%s)", user.email, user.role)
    return {"message": "Account created! Please check your email to confirm your address."}


async def login_user(payload: LoginRequest, db: AsyncSession) -> AuthResponse:
    """
    Validate credentials, return JWT + user object.
    Blocks unverified accounts.
    """
    user = await db.scalar(select(User).where(User.email == payload.email))

    # Use a single generic error to avoid email enumeration attacks
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )

    if not user or not verify_password(payload.password, user.hashed_password):
        raise invalid

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please confirm your email address before logging in.",
        )

    token = create_access_token(subject=user.id)
    return AuthResponse(user=UserOut.from_orm_user(user), token=token)


async def verify_email(token: str, db: AsyncSession) -> dict:
    """
    Accept the token from the confirmation link and activate the account.
    """
    user = await db.scalar(
        select(User).where(User.verification_token == token)
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired confirmation link.",
        )

    user.is_verified = True
    user.verification_token = None
    await db.commit()

    logger.info("Email verified for user: %s", user.email)
    return {"message": "Email confirmed! You can now log in."}
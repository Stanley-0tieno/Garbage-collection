import secrets
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, AuthResponse, UserOut, MessageResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.email import send_verification_email


async def register_user(payload: SignupRequest, db: AsyncSession) -> MessageResponse:
    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Role-specific field validation
    if payload.role == "household" and not payload.nationalId:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="National ID is required for household accounts.",
        )
    if payload.role == "collector":
        if not payload.businessRegNumber:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Business registration number is required for collector accounts.",
            )
        if not payload.vehicleNumberPlate:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Vehicle number plate is required for collector accounts.",
            )

    verification_token = secrets.token_urlsafe(32)

    user = User(
        first_name=payload.firstName,
        last_name=payload.lastName,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        # Household field
        national_id=payload.nationalId if payload.role == "household" else None,
        # Collector fields
        business_reg_number=(
            payload.businessRegNumber if payload.role == "collector" else None
        ),
        vehicle_number_plate=(
            payload.vehicleNumberPlate if payload.role == "collector" else None
        ),
        is_verified=False,
        verification_token=verification_token,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Send verification email (non-blocking)
    try:
        await send_verification_email(user.email, user.first_name, verification_token)
    except Exception:
        pass  # Don't fail registration if email fails

    return MessageResponse(
        message="Account created! Please check your email to verify your account."
    )


async def login_user(payload: LoginRequest, db: AsyncSession) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in.",
        )

    # ✅ FIX: pass user.id directly, not {"sub": user.id}
    token = create_access_token(user.id)
    return AuthResponse(user=UserOut.model_validate(user), token=token)


async def verify_email(token: str, db: AsyncSession) -> MessageResponse:
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )

    user.is_verified = True
    user.verification_token = None
    await db.commit()

    return MessageResponse(message="Email verified successfully! You can now log in.")
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.payment import STKPushRequest, STKPushResponse, PaymentStatusResponse
from app.services.payment_service import initiate_stk_push, handle_mpesa_callback, get_payment_status

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/mpesa/stk", response_model=STKPushResponse)
async def api_stk_push(payload: STKPushRequest, db: AsyncSession = Depends(get_db)):
    return await initiate_stk_push(payload, db)

@router.get("/status/{checkout_request_id}", response_model=PaymentStatusResponse)
async def api_get_payment_status(checkout_request_id: str, db: AsyncSession = Depends(get_db)):
    return await get_payment_status(checkout_request_id, db)

@router.post("/mpesa/callback")
async def api_mpesa_callback(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.json()
    return await handle_mpesa_callback(payload, db)

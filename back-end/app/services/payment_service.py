import base64
import httpx
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.pickup import Pickup
from app.models.notification import Notification
from app.schemas.payment import STKPushRequest

async def get_daraja_token():
    auth_string = f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}"
    encoded = base64.b64encode(auth_string.encode()).decode('utf-8')
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" if settings.MPESA_ENV == "sandbox" else "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers={"Authorization": f"Basic {encoded}"})
        response.raise_for_status()
        return response.json()["access_token"]

async def initiate_stk_push(payload: STKPushRequest, db: AsyncSession):
    pickup = await db.get(Pickup, payload.pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
        
    try:
        token = await get_daraja_token()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Daraja token failed: {str(e)}")
        
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password_str = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode('utf-8')
    
    url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest" if settings.MPESA_ENV == "sandbox" else "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    
    # format phone to 254...
    phone = payload.phone
    if phone.startswith("0"): phone = "254" + phone[1:]
    if phone.startswith("+"): phone = phone[1:]
        
    stk_payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(payload.amount),
        "PartyA": phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": settings.MPESA_CALLBACK_URL,
        "AccountReference": f"Pickup-{pickup.id[:8]}",
        "TransactionDesc": "Waste Collection Payment"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers={"Authorization": f"Bearer {token}"}, json=stk_payload)
            res.raise_for_status()
            data = res.json()
            
            checkout_request_id = data["CheckoutRequestID"]
            
            pickup.payment_ref = checkout_request_id
            pickup.payment_status = "PENDING"
            await db.commit()
            
            return {
                "checkout_request_id": checkout_request_id,
                "message": "STK Push initiated successfully"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def handle_mpesa_callback(payload: dict, db: AsyncSession):
    try:
        stk_callback = payload.get("Body", {}).get("stkCallback", {})
        checkout_request_id = stk_callback.get("CheckoutRequestID")
        result_code = stk_callback.get("ResultCode")
        
        if not checkout_request_id:
            return {"status": "ignored"}
            
        result = await db.execute(select(Pickup).where(Pickup.payment_ref == checkout_request_id))
        pickup = result.scalar_one_or_none()
        
        if not pickup:
            return {"status": "not_found"}
            
        if result_code == 0:
            pickup.payment_status = "PAID"
            notif = Notification(user_id=pickup.user_id, type="payment_success", title="Payment Successful", message=f"Payment for your pickup was confirmed.", pickup_id=pickup.id)
            db.add(notif)
        else:
            pickup.payment_status = "FAILED"
            
        await db.commit()
        return {"status": "processed"}
    except Exception:
        return {"status": "ignored"}

async def get_payment_status(checkout_request_id: str, db: AsyncSession):
    result = await db.execute(select(Pickup).where(Pickup.payment_ref == checkout_request_id))
    pickup = result.scalar_one_or_none()
    
    if not pickup:
        raise HTTPException(status_code=404, detail="Payment reference not found")
        
    return {"status": pickup.payment_status}

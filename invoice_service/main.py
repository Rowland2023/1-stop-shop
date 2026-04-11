import os
import io
import hmac
import hashlib
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

load_dotenv()

app = FastAPI(title="Lagos Tech Hub: Invoicing & Payroll Service")

# Enhanced CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
# Use the Render Internal/External URL for your Django service
DJANGO_SERVICE_URL = os.getenv("DJANGO_SERVICE_URL", "https://back-end-wdk7.onrender.com")
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")

# --- 0. ROOT HEALTH CHECK (Fixes the 404 at /) ---
@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "Lagos Tech Hub Invoicing",
        "endpoints": {
            "generate_invoice": "/api/invoices/generate",
            "docs": "/docs"
        }
    }

# --- 1. HELPER: UPDATE DJANGO STATUS ---
async def update_order_status(order_id: int, status: str):
    url = f"{DJANGO_SERVICE_URL}/api/orders/{order_id}/"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.patch(url, json={"status": status}, timeout=5.0)
            if response.status_code not in [200, 204]:
                print(f"Django update failed: {response.status_code}")
        except Exception as e:
            print(f"Failed to update Django status: {e}")

# --- 2. HELPER: MARKETPLACE PDF GENERATOR ---
async def generate_marketplace_pdf(order_id: int):
    django_url = f"{DJANGO_SERVICE_URL}/api/orders/{order_id}/"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(django_url, headers={"Accept": "application/json"}, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Order not found")
            order_data = response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Django Offline: {exc}")

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    
    p.setFillColor(colors.HexColor("#2e7d32"))
    p.rect(0, 780, 600, 100, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, 805, "LAGOS TECH HUB - MARKETPLACE")
    
    order_date = order_data.get('created_at', 'N/A')
    formatted_date = order_date[:10] if order_date != 'N/A' else 'N/A'
    
    p.setFont("Helvetica", 11)
    p.drawString(50, 790, f"Official Receipt | Order Ref: #{order_id}")
    p.drawRightString(550, 790, f"Date: {formatted_date}")

    p.setFillColor(colors.black)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 730, "ITEMS PURCHASED")
    p.line(50, 725, 550, 725)

    y = 700
    p.setFont("Helvetica", 11)
    items = order_data.get('items', [])
    for item in items:
        name = item.get('product_name', 'Unknown Product')
        qty = item.get('quantity', 0)
        price = item.get('price_at_purchase', '0.00')
        
        p.drawString(50, y, f"{name} (x{qty})")
        p.drawRightString(550, y, f"N {price}")
        y -= 25

    p.line(50, y + 10, 550, y + 10)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y - 20, f"TOTAL PAID: N {order_data.get('total_price')}")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue(), f"receipt_{order_id}.pdf"

# --- 3. HELPER: HRM PAYSLIP GENERATOR ---
async def generate_hrm_payslip_pdf(user_id: str):
    django_url = f"{DJANGO_SERVICE_URL}/api/employees/{user_id}/"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(django_url, timeout=10.0)
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Employee not found")
            emp_data = response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Django Offline: {exc}")

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    
    p.setFillColor(colors.HexColor("#1565c0"))
    p.rect(0, 780, 600, 100, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, 805, "LAGOS TECH HUB - HRM")
    p.setFont("Helvetica", 12)
    p.drawString(50, 790, f"Monthly Payslip | Employee ID: {user_id}")

    first = emp_data.get('first_name', '')
    last = emp_data.get('last_name', '')
    full_name = f"{first} {last}".strip()

    p.setFillColor(colors.black)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 730, f"Employee Name: {full_name}")
    p.line(50, 725, 550, 725)

    p.setFont("Helvetica", 12)
    dept = emp_data.get('department_name') or emp_data.get('department', 'N/A')
    p.drawString(50, 700, f"Department: {dept}")
    p.drawString(50, 680, f"Position: {emp_data.get('position', 'N/A')}")
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 650, f"Net Salary: N {emp_data.get('salary', '0.00')}")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue(), f"payslip_{user_id}.pdf"

# --- 4. UNIFIED ROUTE ---
@app.get("/api/invoices/generate")
async def generate_invoice_route(
    order_id: int = Query(None),
    user_id: str = Query(None)
):
    if order_id:
        pdf_content, filename = await generate_marketplace_pdf(order_id)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    if user_id:
        pdf_content, filename = await generate_hrm_payslip_pdf(user_id)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    raise HTTPException(status_code=400, detail="Missing order_id or user_id")

# --- 5. WEBHOOKS ---
@app.post("/api/paystack/webhook")
async def paystack_webhook(request: Request, x_paystack_signature: str = Header(None)):
    if not PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Paystack secret key not configured")
        
    payload = await request.body()
    computed_signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode(),
        payload,
        hashlib.sha512
    ).hexdigest()

    if computed_signature != x_paystack_signature:
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()
    if data['event'] == 'charge.success':
        try:
            order_id = data['data']['metadata']['custom_fields'][0]['value']
            await update_order_status(order_id, "Paid")
        except (KeyError, IndexError):
            print("Webhook received but order metadata missing")

    return {"status": "success"}
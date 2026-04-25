from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
import io

class PDFService:
    @staticmethod
    def create_marketplace_pdf(order_data: dict):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        # Add your design logic here (keeping the design logic clean)
        p.setFillColor(colors.HexColor("#2e7d32"))
        p.rect(0, 780, 600, 100, fill=1)
        # ... logic ...
        p.save()
        buffer.seek(0)
        return buffer.getvalue()
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', 'admin@serennebeauty.com')
WHATSAPP_NUMBER = os.environ.get('WHATSAPP_NUMBER', '00971501703131')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'serenne-beauty-secret-key-2024')
JWT_ALGORITHM = 'HS256'

# Models
class VipSignup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    language: str = "en"
    source: str = "website"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VipSignupCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    language: str = "en"
    source: str = "website"

class QuizResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    skin_type: str
    concern: str
    experience: str
    budget: str
    name: Optional[str] = None
    contact: Optional[str] = None
    language: str = "en"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuizResponseCreate(BaseModel):
    skin_type: str
    concern: str
    experience: str
    budget: str
    name: Optional[str] = None
    contact: Optional[str] = None
    language: str = "en"

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    package_id: str
    package_name: str
    date: str
    time_slot: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    name: str
    phone: str
    package_id: str
    package_name: str
    date: str
    time_slot: str

class Package(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name_en: str
    name_ar: str
    description_en: str
    description_ar: str
    price_aed: int
    features_en: List[str]
    features_ar: List[str]
    is_popular: bool = False

class PackageUpdate(BaseModel):
    price_aed: Optional[int] = None
    description_en: Optional[str] = None
    description_ar: Optional[str] = None

class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_en: str
    name_ar: str
    text_en: str
    text_ar: str
    rating: int = 5

class TestimonialCreate(BaseModel):
    name_en: str
    name_ar: str
    text_en: str
    text_ar: str
    rating: int = 5

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminLoginResponse(BaseModel):
    token: str
    email: str

class BookingStatusUpdate(BaseModel):
    status: str

# Helper functions
async def send_email_notification(recipient: str, subject: str, html_content: str):
    if not resend.api_key or resend.api_key == 're_your_api_key_here':
        logger.warning("Resend API key not configured, skipping email")
        return
    
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {recipient}")
        return email
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Serenne Beauty API"}

@api_router.post("/vip-signup", response_model=VipSignup)
async def create_vip_signup(input: VipSignupCreate):
    signup = VipSignup(**input.model_dump())
    doc = signup.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.vip_signups.insert_one(doc)
    
    # Send email notification to owner
    await send_email_notification(
        OWNER_EMAIL,
        "New VIP Waitlist Signup - Serenne Beauty",
        f"<h2>New VIP Signup</h2><p><strong>Name:</strong> {signup.name}</p><p><strong>Email:</strong> {signup.email or 'N/A'}</p><p><strong>Phone:</strong> {signup.phone or 'N/A'}</p><p><strong>Language:</strong> {signup.language}</p>"
    )
    
    return signup

@api_router.post("/quiz", response_model=QuizResponse)
async def create_quiz_response(input: QuizResponseCreate):
    quiz = QuizResponse(**input.model_dump())
    doc = quiz.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.quiz_responses.insert_one(doc)
    return quiz

@api_router.get("/quiz/{quiz_id}", response_model=QuizResponse)
async def get_quiz_response(quiz_id: str):
    quiz = await db.quiz_responses.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz response not found")
    if isinstance(quiz['created_at'], str):
        quiz['created_at'] = datetime.fromisoformat(quiz['created_at'])
    return quiz

@api_router.post("/bookings", response_model=Booking)
async def create_booking(input: BookingCreate):
    booking = Booking(**input.model_dump())
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.bookings.insert_one(doc)
    
    # Send email notification to owner
    await send_email_notification(
        OWNER_EMAIL,
        "New Session Booking - Serenne Beauty",
        f"<h2>New Booking</h2><p><strong>Name:</strong> {booking.name}</p><p><strong>Phone:</strong> {booking.phone}</p><p><strong>Package:</strong> {booking.package_name}</p><p><strong>Date:</strong> {booking.date}</p><p><strong>Time:</strong> {booking.time_slot}</p>"
    )
    
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    for booking in bookings:
        if isinstance(booking['created_at'], str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    return bookings

@api_router.get("/packages", response_model=List[Package])
async def get_packages():
    packages = await db.packages.find({}, {"_id": 0}).to_list(100)
    return packages

@api_router.get("/testimonials", response_model=List[Testimonial])
async def get_testimonials():
    testimonials = await db.testimonials.find({}, {"_id": 0}).to_list(100)
    return testimonials

# Admin routes
@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(credentials: AdminLogin):
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@serennebeauty.com')
    admin_password_hash = os.environ.get('ADMIN_PASSWORD', '')
    
    if credentials.email != admin_email:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), admin_password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode(
        {"email": credentials.email, "exp": datetime.now(timezone.utc) + timedelta(days=7)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    return AdminLoginResponse(token=token, email=credentials.email)

@api_router.get("/admin/signups", response_model=List[VipSignup])
async def get_admin_signups(payload: dict = Depends(verify_token)):
    signups = await db.vip_signups.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for signup in signups:
        if isinstance(signup['created_at'], str):
            signup['created_at'] = datetime.fromisoformat(signup['created_at'])
    return signups

@api_router.get("/admin/quiz-responses", response_model=List[QuizResponse])
async def get_admin_quiz_responses(payload: dict = Depends(verify_token)):
    responses = await db.quiz_responses.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for resp in responses:
        if isinstance(resp['created_at'], str):
            resp['created_at'] = datetime.fromisoformat(resp['created_at'])
    return responses

@api_router.get("/admin/bookings", response_model=List[Booking])
async def get_admin_bookings(payload: dict = Depends(verify_token)):
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for booking in bookings:
        if isinstance(booking['created_at'], str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    return bookings

@api_router.put("/admin/bookings/{booking_id}", response_model=Booking)
async def update_booking_status(booking_id: str, update: BookingStatusUpdate, payload: dict = Depends(verify_token)):
    result = await db.bookings.find_one_and_update(
        {"id": booking_id},
        {"$set": {"status": update.status}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Booking not found")
    result.pop('_id', None)
    if isinstance(result['created_at'], str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    return result

@api_router.put("/admin/packages/{package_id}", response_model=Package)
async def update_package(package_id: str, update: PackageUpdate, payload: dict = Depends(verify_token)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.packages.find_one_and_update(
        {"id": package_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Package not found")
    result.pop('_id', None)
    return result

@api_router.post("/admin/testimonials", response_model=Testimonial)
async def create_testimonial(input: TestimonialCreate, payload: dict = Depends(verify_token)):
    testimonial = Testimonial(**input.model_dump())
    doc = testimonial.model_dump()
    await db.testimonials.insert_one(doc)
    return testimonial

@api_router.get("/admin/stats")
async def get_admin_stats(payload: dict = Depends(verify_token)):
    total_signups = await db.vip_signups.count_documents({})
    total_quizzes = await db.quiz_responses.count_documents({})
    
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    bookings_this_week = await db.bookings.count_documents({"created_at": {"$gte": week_ago}})
    
    return {
        "total_vip_signups": total_signups,
        "total_quizzes": total_quizzes,
        "bookings_this_week": bookings_this_week
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def seed_database():
    # Seed packages
    existing_packages = await db.packages.count_documents({})
    if existing_packages == 0:
        packages = [
            {
                "id": "full-glow",
                "name_en": "The Full Glow",
                "name_ar": "التوهج الكامل",
                "description_en": "Our most comprehensive package: complete skin analysis, personalized shopping experience, daily makeup course, and evening glam masterclass.",
                "description_ar": "باقتنا الأكثر شمولاً: تحليل كامل للبشرة، تجربة تسوق شخصية، دورة مكياج يومية، ودورة مكياج مسائي.",
                "price_aed": 1499,
                "features_en": ["Complete skin analysis", "Shop-together session", "Daily makeup course", "Evening glam masterclass"],
                "features_ar": ["تحليل كامل للبشرة", "جلسة تسوق مشتركة", "دورة مكياج يومية", "دورة مكياج مسائي"],
                "is_popular": True
            },
            {
                "id": "everyday-glow",
                "name_en": "Everyday Glow",
                "name_ar": "التوهج اليومي",
                "description_en": "Perfect for beginners: skin analysis and daily makeup basics to build your confidence.",
                "description_ar": "مثالي للمبتدئين: تحليل البشرة وأساسيات المكياج اليومي لبناء ثقتك.",
                "price_aed": 799,
                "features_en": ["Skin analysis", "Daily makeup course", "Product recommendations"],
                "features_ar": ["تحليل البشرة", "دورة مكياج يومية", "توصيات المنتجات"],
                "is_popular": False
            },
            {
                "id": "occasion-glow",
                "name_en": "Occasion Glow",
                "name_ar": "توهج المناسبات",
                "description_en": "Master evening and special occasion makeup with expert techniques and tips.",
                "description_ar": "إتقان مكياج المساء والمناسبات الخاصة بتقنيات ونصائح الخبراء.",
                "price_aed": 599,
                "features_en": ["Evening makeup masterclass", "Glam techniques", "Expert tips"],
                "features_ar": ["دورة مكياج مسائي", "تقنيات التألق", "نصائح الخبراء"],
                "is_popular": False
            }
        ]
        await db.packages.insert_many(packages)
        logger.info("Seeded packages")
    
    # Seed testimonials
    existing_testimonials = await db.testimonials.count_documents({})
    if existing_testimonials == 0:
        testimonials = [
            {
                "id": str(uuid.uuid4()),
                "name_en": "Fatima Al-Mansoori",
                "name_ar": "فاطمة المنصوري",
                "text_en": "Serenne Beauty changed everything for me. I finally understand my skin and feel confident doing my own makeup!",
                "text_ar": "سيرين بيوتي غيرت كل شيء بالنسبة لي. أخيراً أفهم بشرتي وأشعر بالثقة في وضع مكياجي بنفسي!",
                "rating": 5
            },
            {
                "id": str(uuid.uuid4()),
                "name_en": "Noor Abdullah",
                "name_ar": "نور عبدالله",
                "text_en": "The personalized approach is incredible. No more wasting money on products that don't work for me.",
                "text_ar": "النهج الشخصي لا يصدق. لم أعد أهدر المال على المنتجات التي لا تناسبني.",
                "rating": 5
            }
        ]
        await db.testimonials.insert_many(testimonials)
        logger.info("Seeded testimonials")
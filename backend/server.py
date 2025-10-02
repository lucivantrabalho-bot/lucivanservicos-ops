from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
from jose import JWTError, jwt
import base64
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from tempfile import NamedTemporaryFile


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here-change-in-production-very-long-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str

class Pendencia(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    site: str
    data_hora: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tipo: str  # "Energia" or "Arcon"
    subtipo: str  # Específico baseado no tipo
    observacoes: str
    foto_base64: Optional[str] = None
    status: str = "Pendente"  # "Pendente" or "Finalizado"
    usuario_criacao: str
    usuario_finalizacao: Optional[str] = None
    data_finalizacao: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PendenciaCreate(BaseModel):
    site: str
    tipo: str
    subtipo: str
    observacoes: str
    foto_base64: Optional[str] = None

class PendenciaUpdate(BaseModel):
    status: str


# Auth helpers
def verify_password(plain_password, hashed_password):
    return get_password_hash(plain_password) == hashed_password

def get_password_hash(password):
    return hashlib.sha256((password + SECRET_KEY).encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return User(**user)


# Routes
@api_router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        hashed_password=hashed_password
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username
    )

@api_router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user["id"],
        username=user["username"]
    )

@api_router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/pendencias", response_model=Pendencia)
async def create_pendencia(pendencia_data: PendenciaCreate, current_user: User = Depends(get_current_user)):
    pendencia = Pendencia(
        site=pendencia_data.site,
        tipo=pendencia_data.tipo,
        subtipo=pendencia_data.subtipo,
        observacoes=pendencia_data.observacoes,
        foto_base64=pendencia_data.foto_base64,
        usuario_criacao=current_user.username
    )
    
    await db.pendencias.insert_one(pendencia.dict())
    return pendencia

@api_router.get("/pendencias", response_model=List[Pendencia])
async def get_pendencias(
    site: Optional[str] = None,
    tipo: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if site:
        query["site"] = site
    if tipo:
        query["tipo"] = tipo
    if status:
        query["status"] = status
    
    pendencias = await db.pendencias.find(query).sort("created_at", -1).to_list(1000)
    return [Pendencia(**pendencia) for pendencia in pendencias]

@api_router.get("/sites")
async def get_sites(current_user: User = Depends(get_current_user)):
    sites = await db.pendencias.distinct("site")
    return {"sites": sites}

@api_router.put("/pendencias/{pendencia_id}", response_model=Pendencia)
async def update_pendencia(
    pendencia_id: str,
    pendencia_update: PendenciaUpdate,
    current_user: User = Depends(get_current_user)
):
    pendencia = await db.pendencias.find_one({"id": pendencia_id})
    if not pendencia:
        raise HTTPException(status_code=404, detail="Pendência not found")
    
    update_data = pendencia_update.dict()
    if pendencia_update.status == "Finalizado":
        update_data["usuario_finalizacao"] = current_user.username
        update_data["data_finalizacao"] = datetime.now(timezone.utc)
    
    await db.pendencias.update_one(
        {"id": pendencia_id},
        {"$set": update_data}
    )
    
    updated_pendencia = await db.pendencias.find_one({"id": pendencia_id})
    return Pendencia(**updated_pendencia)

@api_router.get("/pendencias/export")
async def export_pendencias(
    site: Optional[str] = None,
    tipo: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Build query
    query = {}
    if site:
        query["site"] = site
    if tipo:
        query["tipo"] = tipo
    if status:
        query["status"] = status
    
    # Get data
    pendencias = await db.pendencias.find(query).sort("created_at", -1).to_list(1000)
    
    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Pendências"
    
    # Headers
    headers = [
        "ID", "Site", "Data/Hora", "Tipo", "Subtipo", 
        "Observações", "Status", "Usuário Criação", 
        "Usuário Finalização", "Data Finalização"
    ]
    
    # Style headers
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")
    
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
    
    # Data rows
    for row, pendencia in enumerate(pendencias, 2):
        ws.cell(row=row, column=1, value=pendencia["id"])
        ws.cell(row=row, column=2, value=pendencia["site"])
        ws.cell(row=row, column=3, value=pendencia["data_hora"].strftime("%d/%m/%Y %H:%M") if pendencia.get("data_hora") else "")
        ws.cell(row=row, column=4, value=pendencia["tipo"])
        ws.cell(row=row, column=5, value=pendencia["subtipo"])
        ws.cell(row=row, column=6, value=pendencia["observacoes"])
        ws.cell(row=row, column=7, value=pendencia["status"])
        ws.cell(row=row, column=8, value=pendencia["usuario_criacao"])
        ws.cell(row=row, column=9, value=pendencia.get("usuario_finalizacao", ""))
        ws.cell(row=row, column=10, value=pendencia["data_finalizacao"].strftime("%d/%m/%Y %H:%M") if pendencia.get("data_finalizacao") else "")
    
    # Auto-adjust column width
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # Save to temporary file
    with NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        wb.save(tmp.name)
        return FileResponse(
            tmp.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="pendencias.xlsx"
        )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
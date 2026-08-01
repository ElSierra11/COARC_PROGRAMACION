from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app import models, schemas, auth, database

app = FastAPI(title="COARC Auth Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def seed_default_admin():
    db = database.SessionLocal()
    try:
        models.Base.metadata.create_all(bind=database.engine)
        
        # 1. Administrador General (ADMIN)
        admin_email = "alejosierra656@gmail.com"
        super_admin = db.query(models.User).filter(
            (models.User.username == "alejosierra") | (models.User.email == admin_email)
        ).first()

        if not super_admin:
            super_admin = models.User(
                username="alejosierra",
                email=admin_email,
                full_name="Alejandro Sierra (Administrador)",
                hashed_password=auth.get_password_hash("Alejandro10@"),
                role="ADMIN",
                is_active=True
            )
            db.add(super_admin)
        else:
            super_admin.role = "ADMIN"
            super_admin.hashed_password = auth.get_password_hash("Alejandro10@")

        # 2. Coordinador Profe (PROFE)
        profe_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not profe_user:
            default_profe = models.User(
                username="admin",
                email="admin@coarc.com",
                full_name="Profesor / Coordinador COARC",
                hashed_password=auth.get_password_hash("coarc2026"),
                role="PROFE",
                is_active=True
            )
            db.add(default_profe)
        else:
            profe_user.role = "PROFE"
            profe_user.hashed_password = auth.get_password_hash("coarc2026")

        db.commit()
    except Exception as e:
        print("Error en seed_default_admin:", e)
    finally:
        db.close()

@app.get("/api/v1/auth/health")
def health_check():
    return {"status": "ok", "service": "Auth Service COARC"}

@app.post("/api/v1/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(
        (models.User.username.ilike(user_in.username)) | (models.User.email.ilike(user_in.email))
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario o correo ya está registrado.")
    
    hashed_pwd = auth.get_password_hash(user_in.password)
    new_user = models.User(
        username=user_in.username.lower(),
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        role=user_in.role or "PROFE"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/v1/auth/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    username_clean = form_data.username.strip().lower()
    user = db.query(models.User).filter(models.User.username.ilike(username_clean)).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas. Verifique el usuario y la contraseña.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse.from_orm(user)
    }

@app.get("/api/v1/auth/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

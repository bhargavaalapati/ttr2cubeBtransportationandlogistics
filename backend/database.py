import enum
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./boardwise.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserRole(str, enum.Enum):
    COMMUTER = "commuter"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.COMMUTER, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reports = relationship("Report", back_populates="user")

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False) # e.g. "218D"
    name = Column(String, nullable=False) # e.g. "Patancheru to Koti"
    start_point = Column(String, nullable=False)
    end_point = Column(String, nullable=False)

    stops = relationship("Stop", back_populates="route", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="route")

class Stop(Base):
    __tablename__ = "stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    name = Column(String, nullable=False) # e.g. "Ameerpet Metro Stop"
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    sequence = Column(Integer, nullable=False)
    reliability_score = Column(Float, default=100.0) # Ghost stop tracking

    route = relationship("Route", back_populates="stops")
    reports = relationship("Report", back_populates="stop")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    stop_id = Column(Integer, ForeignKey("stops.id"), nullable=True)
    crowding_level = Column(Integer, nullable=False) # 0 (empty) to 100 (jammed)
    did_stop = Column(Boolean, default=True)
    punctuality_score = Column(Float, default=80.0)
    raw_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reports")
    route = relationship("Route", back_populates="reports")
    stop = relationship("Stop", back_populates="reports")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
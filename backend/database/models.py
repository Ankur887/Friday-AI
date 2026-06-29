from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from database.db import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name      = Column(String(100), nullable=False)
    last_name       = Column(String(100), nullable=True)
    username        = Column(String(100), unique=True, nullable=False)
    email           = Column(String(255), unique=True, nullable=False)
    password_hash   = Column(String(255), nullable=False)
    avatar_url      = Column(String(500), nullable=True)
    role            = Column(String(20), default="user")
    subscription_type = Column(String(20), default="free")
    email_verified  = Column(Boolean, default=False)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow)
    last_login      = Column(DateTime, nullable=True)

    conversations   = relationship("Conversation", back_populates="user", cascade="all, delete")
    email_verifications = relationship("EmailVerification", back_populates="user", cascade="all, delete")
    refresh_tokens  = relationship("RefreshToken", back_populates="user", cascade="all, delete")


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    otp_code   = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified   = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="email_verifications")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token      = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    title      = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user     = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete")


class Message(Base):
    __tablename__ = "messages"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"))
    role            = Column(String(20))
    content         = Column(Text)
    created_at      = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
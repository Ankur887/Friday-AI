from database.db import SessionLocal
from database.models import Conversation, Message


def create_conversation(title: str, user_id: str = None):
    db = SessionLocal()
    conversation = Conversation(title=title, user_id=user_id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    db.close()
    return conversation


def get_conversations(user_id: str = None):
    db = SessionLocal()
    # ✅ If no user_id, return empty list — never leak other users' conversations
    if not user_id:
        db.close()
        return []
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )
    db.close()
    return conversations


def get_conversation_by_id(conversation_id: str):
    """Fetch a single conversation — used for ownership checks."""
    db = SessionLocal()
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()
    db.close()
    return conversation


def delete_conversation(conversation_id: str):
    db = SessionLocal()
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.query(Conversation).filter(Conversation.id == conversation_id).delete()
    db.commit()
    db.close()
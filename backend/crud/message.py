from database.db import SessionLocal
from database.models import Message


def create_message(conversation_id, role, content):
    db = SessionLocal()

    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content
    )

    db.add(message)
    db.commit()
    db.refresh(message)
    db.close()

    return message


def get_messages(conversation_id):
    db = SessionLocal()

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )

    db.close()

    return messages
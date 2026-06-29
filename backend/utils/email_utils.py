import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")


def _get_smtp_config():
    return {
        "host":     os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port":     int(os.getenv("SMTP_PORT", 587)),
        "user":     os.getenv("SMTP_USER"),
        "password": os.getenv("SMTP_PASSWORD"),
    }


def _send(to_email: str, subject: str, html: str):
    cfg = _get_smtp_config()

    if not cfg["user"] or not cfg["password"]:
        raise RuntimeError("SMTP credentials not loaded.")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = "Friday AI <" + cfg["user"] + ">"
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
        server.ehlo()
        server.starttls()
        server.login(cfg["user"], cfg["password"])
        server.sendmail(cfg["user"], to_email, msg.as_string())

def send_otp_email(to_email: str, otp: str, name: str = ""):
    greeting = "Hi " + name + "," if name else "Hi,"

    html = (
        '<html>'
        '<body style="margin:0;padding:0;background:#0f0f10;font-family:\'Segoe UI\',Arial,sans-serif;">'
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:40px 0;">'
        '<tr><td align="center">'
        '<table width="480" cellpadding="0" cellspacing="0" '
        'style="background:#131314;border-radius:16px;border:1px solid #2a2b2c;overflow:hidden;">'

        '<tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">'
        '<h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Friday</h1>'
        '<p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Your AI Assistant</p>'
        '</td></tr>'

        '<tr><td style="padding:36px 40px;">'
        '<p style="color:#bdc1c6;font-size:15px;margin:0 0 8px;">' + greeting + '</p>'
        '<p style="color:#bdc1c6;font-size:15px;margin:0 0 28px;">'
        'Use the code below to verify your email address. It expires in '
        '<strong style="color:#e3e3e3;">10 minutes</strong>.'
        '</p>'
        '<div style="background:#1e1f20;border:1px solid #3a3b3c;border-radius:12px;'
        'padding:28px;text-align:center;margin-bottom:28px;">'
        '<p style="color:#888;font-size:12px;letter-spacing:2px;'
        'text-transform:uppercase;margin:0 0 12px;">Verification Code</p>'
        '<span style="font-size:42px;font-weight:800;letter-spacing:10px;color:#6366f1;'
        'font-family:\'Courier New\',monospace;">' + otp + '</span>'
        '</div>'
        '<p style="color:#666;font-size:13px;margin:0;line-height:1.6;">'
        "If you didn't create a Friday account, you can safely ignore this email."
        '</p>'
        '</td></tr>'

        '<tr><td style="padding:20px 40px;border-top:1px solid #2a2b2c;text-align:center;">'
        '<p style="color:#555;font-size:12px;margin:0;">© 2025 Friday AI. All rights reserved.</p>'
        '</td></tr>'

        '</table></td></tr></table>'
        '</body></html>'
    )

    _send(to_email, "Your Friday verification code", html)


def send_welcome_email(to_email: str, name: str = "", username: str = ""):
    greeting = "Welcome to Friday, " + name + "! 🎉" if name else "Welcome to Friday! 🎉"
    subject  = "Welcome to Friday, " + name + "!" if name else "Welcome to Friday!"

    # Build username line separately — avoids nested f-string/backslash issues
    username_line = (
        '<p style="color:#888;font-size:13px;margin:0 0 24px;">'
        'Your username: <strong style="color:#6366f1;">@' + username + '</strong>'
        '</p>'
    ) if username else ""

    # Build feature rows separately
    features = [
        ("💬", "Have natural conversations on any topic"),
        ("💻", "Write, debug, and explain code"),
        ("📝", "Draft emails, essays, and documents"),
        ("🧠", "Brainstorm ideas and solve problems"),
    ]
    feature_rows = "".join(
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
        '<span style="font-size:18px;">' + icon + '</span>'
        '<span style="color:#bdc1c6;font-size:14px;">' + text + '</span>'
        '</div>'
        for icon, text in features
    )

    html = (
        '<html>'
        '<body style="margin:0;padding:0;background:#0f0f10;font-family:\'Segoe UI\',Arial,sans-serif;">'
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:40px 0;">'
        '<tr><td align="center">'
        '<table width="480" cellpadding="0" cellspacing="0" '
        'style="background:#131314;border-radius:16px;border:1px solid #2a2b2c;overflow:hidden;">'

        '<tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">'
        '<h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Friday</h1>'
        '<p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Your AI Assistant</p>'
        '</td></tr>'

        '<tr><td style="padding:36px 40px;">'
        '<h2 style="color:#e3e3e3;font-size:22px;margin:0 0 16px;">' + greeting + '</h2>'
        '<p style="color:#bdc1c6;font-size:15px;margin:0 0 24px;line-height:1.7;">'
        'Your account is verified and ready to go. Friday is your intelligent AI companion — '
        'ask anything, explore ideas, write code, or just have a conversation.'
        '</p>'

        '<div style="background:#1e1f20;border-radius:12px;padding:24px;margin-bottom:28px;">'
        '<p style="color:#888;font-size:12px;letter-spacing:2px;'
        'text-transform:uppercase;margin:0 0 16px;">What you can do</p>'
        + feature_rows +
        '</div>'

        + username_line +

        '<p style="color:#666;font-size:13px;margin:0;line-height:1.6;">'
        "Thanks for choosing Friday. We're excited to have you on board."
        '</p>'
        '</td></tr>'

        '<tr><td style="padding:20px 40px;border-top:1px solid #2a2b2c;text-align:center;">'
        '<p style="color:#555;font-size:12px;margin:0;">© 2025 Friday AI. All rights reserved.</p>'
        '</td></tr>'

        '</table></td></tr></table>'
        '</body></html>'
    )

    _send(to_email, subject, html)
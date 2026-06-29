"""
Run this from inside your backend/ folder:
    python test_smtp.py

It will test every layer one by one and tell you exactly where it fails.
"""

import os
import sys
import socket
import smtplib
from pathlib import Path
from dotenv import load_dotenv

# ── 1. Load .env ──────────────────────────────────────────────────────────────
env_path = Path(__file__).resolve().parent / ".env"
print(f"\n[1] Loading .env from: {env_path}")
if not env_path.exists():
    print("    ❌ .env file NOT FOUND at that path")
    print("       Make sure you run this script from inside backend/")
    sys.exit(1)

load_dotenv(dotenv_path=env_path)
print("    ✅ .env file found and loaded")

# ── 2. Check credentials are present ─────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

print(f"\n[2] Checking credentials in .env")
print(f"    SMTP_HOST     = {SMTP_HOST}")
print(f"    SMTP_PORT     = {SMTP_PORT}")
print(f"    SMTP_USER     = {SMTP_USER}")
print(f"    SMTP_PASSWORD = {'[SET - ' + str(len(SMTP_PASSWORD)) + ' chars]' if SMTP_PASSWORD else '[NOT SET ❌]'}")

if not SMTP_USER:
    print("    ❌ SMTP_USER is missing from .env")
    sys.exit(1)
if not SMTP_PASSWORD:
    print("    ❌ SMTP_PASSWORD is missing from .env")
    sys.exit(1)

# Check for spaces in password (common mistake)
if " " in SMTP_PASSWORD:
    print(f"    ❌ SMTP_PASSWORD contains spaces — remove all spaces")
    print(f"       Current value repr: {repr(SMTP_PASSWORD)}")
    sys.exit(1)

if len(SMTP_PASSWORD) != 16:
    print(f"    ⚠️  SMTP_PASSWORD is {len(SMTP_PASSWORD)} chars (expected 16 for a Gmail App Password)")
else:
    print(f"    ✅ Credentials present, password is 16 chars (correct length)")

# ── 3. DNS / network reachability ────────────────────────────────────────────
print(f"\n[3] Testing network reachability to {SMTP_HOST}:{SMTP_PORT}")
try:
    ip = socket.gethostbyname(SMTP_HOST)
    print(f"    ✅ DNS resolved: {SMTP_HOST} → {ip}")
except socket.gaierror as e:
    print(f"    ❌ DNS resolution failed: {e}")
    print("       Check your internet connection")
    sys.exit(1)

try:
    sock = socket.create_connection((SMTP_HOST, SMTP_PORT), timeout=10)
    sock.close()
    print(f"    ✅ TCP connection to {SMTP_HOST}:{SMTP_PORT} succeeded")
except Exception as e:
    print(f"    ❌ TCP connection failed: {e}")
    print("       Port 587 may be blocked by your firewall or ISP")
    print("       Try from a different network or use port 465 with SSL")
    sys.exit(1)

# ── 4. SMTP handshake ─────────────────────────────────────────────────────────
print(f"\n[4] SMTP handshake + STARTTLS")
try:
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
    server.set_debuglevel(0)
    server.ehlo()
    server.starttls()
    server.ehlo()
    print("    ✅ STARTTLS handshake succeeded")
except Exception as e:
    print(f"    ❌ SMTP handshake failed: {e}")
    sys.exit(1)

# ── 5. Authentication ─────────────────────────────────────────────────────────
print(f"\n[5] Authenticating as {SMTP_USER}")
try:
    server.login(SMTP_USER, SMTP_PASSWORD)
    print("    ✅ Authentication succeeded")
except smtplib.SMTPAuthenticationError as e:
    print(f"    ❌ Authentication FAILED: {e}")
    print()
    print("    Common causes:")
    print("    a) Wrong App Password — go to Google Account → Security →")
    print("       2-Step Verification → App passwords and regenerate")
    print("    b) 2-Step Verification is not enabled on your Google account")
    print("    c) 'Less secure app access' is required but not enabled")
    print("       (only for accounts WITHOUT 2FA)")
    print("    d) The Gmail account has security alerts blocking the login —")
    print("       check your Gmail inbox for a Google security email")
    server.quit()
    sys.exit(1)
except Exception as e:
    print(f"    ❌ Login error: {e}")
    server.quit()
    sys.exit(1)

# ── 6. Send a real test email ─────────────────────────────────────────────────
TEST_RECIPIENT = SMTP_USER  # sends to yourself — change if needed

print(f"\n[6] Sending test email to {TEST_RECIPIENT}")
try:
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Friday SMTP Test — it works!"
    msg["From"]    = f"Friday AI <{SMTP_USER}>"
    msg["To"]      = TEST_RECIPIENT
    msg.attach(MIMEText(
        "<h2 style='color:#6366f1'>SMTP is working ✅</h2>"
        "<p>Your email configuration is correct.</p>",
        "html"
    ))

    server.sendmail(SMTP_USER, TEST_RECIPIENT, msg.as_string())
    server.quit()
    print(f"    ✅ Test email sent to {TEST_RECIPIENT}")
    print()
    print("=" * 60)
    print("  ALL CHECKS PASSED — email delivery is working correctly")
    print("  Check your inbox (and spam folder) for the test email")
    print("=" * 60)

except Exception as e:
    print(f"    ❌ Send failed: {e}")
    server.quit()
    sys.exit(1)
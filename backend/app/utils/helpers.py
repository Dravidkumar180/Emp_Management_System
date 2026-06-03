from typing import Dict, Any

def format_response(success: bool, message: str, data: Any = None) -> Dict:
    """Format API response"""
    response = {
        "success": success,
        "message": message
    }
    if data is not None:
        response["data"] = data
    return response

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def send_admin_notification(admin_email: str, subject: str, message: str) -> bool:
    """Attempt to notify admin. If SMTP env vars are configured, try sending an email.
    Otherwise fall back to logging the notification. Returns True if sent/logged."""
    try:
        import os
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '0') or 0)
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')

        # If SMTP not configured, just log the notification for now
        if not smtp_host or not smtp_port:
            print(f"🔔 Admin notification for {admin_email}: {subject} - {message}")
            return True

        # Try sending email via smtplib
        import smtplib
        from email.message import EmailMessage

        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = smtp_user or 'no-reply@example.com'
        msg['To'] = admin_email
        msg.set_content(message)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        print(f"✅ Sent admin notification to {admin_email}")
        return True
    except Exception as e:
        print(f"Failed to send admin notification to {admin_email}: {e}")
        return False
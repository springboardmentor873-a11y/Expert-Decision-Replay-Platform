import smtplib
from email.message import EmailMessage
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.core.config import settings

logger = logging.getLogger(__name__)

# Use a global thread pool so we aren't creating threads continuously
_executor = ThreadPoolExecutor(max_workers=5)


def _send_email_sync(to_address: str, subject: str, body: str):
    if not settings.EMAIL_ENABLED:
        logger.info(f"EMAIL_ENABLED=false. Would have sent email to {to_address} with subject '{subject}'")
        return

    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = settings.SMTP_FROM
        msg['To'] = to_address

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            logger.info(f"Successfully sent email to {to_address}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_address}: {str(e)}")


def send_email(to_address: str, subject: str, body: str):
    """
    Sends an email by running the synchronous smtplib call
    in a thread pool, preventing it from blocking the caller.
    """
    _executor.submit(_send_email_sync, to_address, subject, body)

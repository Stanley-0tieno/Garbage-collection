"""
Email worker using asyncio.Queue for non-blocking delivery.

Flow:
  1. Any route/service calls  enqueue_email(...)
  2. The item lands in EMAIL_QUEUE (in-memory, async-safe)
  3. email_worker() — started as a background task on app startup —
     drains the queue and sends via SMTP.

For production, swap the queue for Redis + Celery / ARQ / RQ.
"""

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dataclasses import dataclass

from app.core.config import settings

logger = logging.getLogger(__name__)

EMAIL_QUEUE: asyncio.Queue = asyncio.Queue()


@dataclass
class EmailJob:
    to: str
    subject: str
    html_body: str


async def enqueue_email(to: str, subject: str, html_body: str) -> None:
    """Push an email job onto the async queue (non-blocking)."""
    await EMAIL_QUEUE.put(EmailJob(to=to, subject=subject, html_body=html_body))
    logger.info("Email queued → %s | %s", to, subject)



async def email_worker() -> None:
    """Consume EmailJob items and send via SMTP."""
    logger.info("Email worker started.")
    while True:
        job: EmailJob = await EMAIL_QUEUE.get()
        try:
            await asyncio.to_thread(_send_smtp, job)
            logger.info("Email sent → %s", job.to)
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", job.to, exc)
        finally:
            EMAIL_QUEUE.task_done()


def _send_smtp(job: EmailJob) -> None:
    if not settings.SMTP_USER:
        # Dev mode: just log the email body instead of sending
        logger.warning(
            "[DEV] SMTP not configured. Would have sent:\n"
            "  To: %s\n  Subject: %s\n  Body: %s",
            job.to, job.subject, job.html_body[:200],
        )
        return

    logger.info("DEBUG SMTP_USER=%r SMTP_PASSWORD=%r LEN=%d", 
        settings.SMTP_USER, settings.SMTP_PASSWORD, len(settings.SMTP_PASSWORD))

    msg = MIMEMultipart("alternative")
    msg["Subject"] = job.subject
    msg["From"]    = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["To"]      = job.to
    msg.attach(MIMEText(job.html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, job.to, msg.as_string())


def build_confirmation_email(first_name: str, confirm_url: str) -> str:
    return f"""
    <html><body style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#2e7d32;">Welcome to Waste2Worth, {first_name}! 🌱</h2>
      <p>Thank you for signing up. Please confirm your email address to activate your account.</p>
      <p style="text-align:center;margin:32px 0;">
        <a href="{confirm_url}"
           style="background:#2e7d32;color:#fff;padding:14px 28px;
                  border-radius:6px;text-decoration:none;font-weight:bold;">
          Confirm Email
        </a>
      </p>
      <p style="color:#888;font-size:13px;">
        If you did not create an account, you can safely ignore this email.<br>
        This link expires in 24 hours.
      </p>
    </body></html>
    """
"""
Email service for sending AIMHEI report share links via Mimecast SMTP relay.

This module provides async email sending functionality using University of Arizona's
Mimecast SMTP relay servers with automatic failover between primary and secondary servers.
"""

import os
import logging
from typing import Optional, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from pathlib import Path
import aiosmtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger(__name__)


class MimecastEmailService:
    """
    Email service for sending emails via University of Arizona Mimecast SMTP relay.

    Supports automatic failover between primary and secondary relay servers.
    """

    def __init__(self):
        """Initialize email service with Mimecast SMTP configuration."""
        self.smtp_host = os.getenv("SMTP_HOST", "usb-smtp-outbound-1.mimecast.com")
        self.smtp_host_fallback = os.getenv("SMTP_HOST_FALLBACK", "usb-smtp-outbound-2.mimecast.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "aidset@arizona.edu")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "aidset@arizona.edu")
        self.smtp_from_name = os.getenv("SMTP_FROM_NAME", "AIMMS Web Platform")

        # Development mode - log emails instead of sending
        self.dev_mode = os.getenv("EMAIL_DEV_MODE", "false").lower() == "true"

        # Check if SMTP is configured
        self.is_configured = bool(self.smtp_password) or self.dev_mode

        if not self.smtp_password and not self.dev_mode:
            logger.warning("SMTP not configured: SMTP_PASSWORD environment variable is missing")

        if self.dev_mode:
            logger.info("📧 Email service in DEV MODE - emails will be logged, not sent")

        # Initialize Jinja2 template environment
        template_dir = Path(__file__).parent / "email_templates"
        self.jinja_env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )

        logger.info(
            f"Email service initialized - Configured: {self.is_configured}, "
            f"Primary: {self.smtp_host}, Fallback: {self.smtp_host_fallback}"
        )

    async def test_connection(self, use_fallback: bool = False) -> bool:
        """
        Test SMTP connection to verify credentials.

        Args:
            use_fallback: Whether to test fallback server instead of primary

        Returns:
            True if connection successful, False otherwise
        """
        if not self.is_configured:
            logger.error("Cannot test connection: SMTP not configured")
            return False

        # Skip connection test in dev mode
        if self.dev_mode:
            logger.info("📧 [DEV MODE] Skipping SMTP connection test")
            return True

        host = self.smtp_host_fallback if use_fallback else self.smtp_host
        server_type = "fallback" if use_fallback else "primary"

        try:
            smtp = aiosmtplib.SMTP(
                hostname=host,
                port=self.smtp_port,
                use_tls=False,  # Don't use implicit TLS on connection
                start_tls=False  # Don't auto-upgrade, we'll do it manually
            )
            await smtp.connect()
            await smtp.starttls()  # Manually upgrade to TLS
            await smtp.login(self.smtp_username, self.smtp_password)
            await smtp.quit()
            logger.info(f"SMTP connection test successful ({server_type} server: {host})")
            return True
        except Exception as e:
            logger.error(f"SMTP connection test failed ({server_type} server: {host}): {str(e)}")
            return False

    def _create_message(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        reply_to: Optional[str] = None
    ) -> MIMEMultipart:
        """
        Create a MIME multipart message with HTML and plain text versions.

        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_body: HTML version of email body
            text_body: Plain text version of email body
            reply_to: Optional reply-to email address

        Returns:
            MIMEMultipart message object
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = formataddr((self.smtp_from_name, self.smtp_from_email))
        msg['To'] = to_email

        if reply_to:
            msg['Reply-To'] = reply_to

        # Attach plain text version first (clients prefer last alternative)
        part_text = MIMEText(text_body, 'plain')
        msg.attach(part_text)

        # Attach HTML version
        part_html = MIMEText(html_body, 'html')
        msg.attach(part_html)

        return msg

    async def _send_via_smtp(self, message: MIMEMultipart, use_fallback: bool = False) -> None:
        """
        Send email via SMTP server.

        Args:
            message: MIME message to send
            use_fallback: Whether to use fallback server

        Raises:
            aiosmtplib.SMTPException: If sending fails
        """
        host = self.smtp_host_fallback if use_fallback else self.smtp_host

        smtp = aiosmtplib.SMTP(
            hostname=host,
            port=self.smtp_port,
            use_tls=False,  # Don't use implicit TLS on connection
            start_tls=False  # Don't auto-upgrade, we'll do it manually
        )
        await smtp.connect()
        await smtp.starttls()  # Manually upgrade to TLS
        await smtp.login(self.smtp_username, self.smtp_password)
        await smtp.send_message(message)
        await smtp.quit()

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        reply_to: Optional[str] = None
    ) -> bool:
        """
        Send an email with automatic failover between primary and secondary servers.

        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_body: HTML version of email body
            text_body: Plain text version of email body
            reply_to: Optional reply-to email address

        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.is_configured:
            logger.error("Cannot send email: SMTP not configured")
            return False

        # Development mode - just log the email
        if self.dev_mode:
            logger.info(f"📧 [DEV MODE] Would send email to: {to_email}")
            logger.info(f"📧 [DEV MODE] Subject: {subject}")
            logger.info(f"📧 [DEV MODE] Reply-To: {reply_to or 'N/A'}")
            logger.info(f"📧 [DEV MODE] Text body preview:\n{text_body[:500]}")
            return True

        message = self._create_message(to_email, subject, html_body, text_body, reply_to)

        # Try primary server first
        try:
            await self._send_via_smtp(message, use_fallback=False)
            logger.info(f"Email sent successfully to {to_email} via primary server")
            return True
        except Exception as e:
            logger.warning(f"Failed to send via primary server: {str(e)}, trying fallback...")

            # Try fallback server
            try:
                await self._send_via_smtp(message, use_fallback=True)
                logger.info(f"Email sent successfully to {to_email} via fallback server")
                return True
            except Exception as e2:
                logger.error(f"Failed to send email via both servers. Last error: {str(e2)}")
                return False

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render an email template with given context.

        Args:
            template_name: Name of template file (e.g., 'share_link.html')
            context: Dictionary of variables to pass to template

        Returns:
            Rendered template as string
        """
        template = self.jinja_env.get_template(template_name)
        return template.render(**context)

    async def send_share_link_email(
        self,
        to_email: str,
        report_name: str,
        report_score: Optional[float],
        share_link: str,
        expires_at: str,
        sender_name: str,
        custom_message: Optional[str] = None
    ) -> bool:
        """
        Send a share link email for an AIMHEI report.

        Args:
            to_email: Recipient email address
            report_name: Name of the AIMHEI report
            report_score: Report score percentage (optional)
            share_link: Full URL to access the shared report
            expires_at: Expiration date/time string
            sender_name: Name of person sending the report
            custom_message: Optional custom message from sender

        Returns:
            True if email sent successfully, False otherwise
        """
        context = {
            'report_name': report_name,
            'report_score': report_score,
            'share_link': share_link,
            'expires_at': expires_at,
            'sender_name': sender_name,
            'custom_message': custom_message,
            'recipient_email': to_email
        }

        try:
            # Render HTML version
            html_body = self.render_template('share_link.html', context)

            # Render plain text version
            text_body = self.render_template('share_link.txt', context)

            # Create subject line
            subject = f"AIMHEI Report Shared: {report_name}"

            # Send email
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body
            )
        except Exception as e:
            logger.error(f"Error sending share link email: {str(e)}")
            return False


# Global email service instance
_email_service: Optional[MimecastEmailService] = None


def get_email_service() -> MimecastEmailService:
    """
    Get or create the global email service instance.

    Returns:
        MimecastEmailService instance
    """
    global _email_service
    if _email_service is None:
        _email_service = MimecastEmailService()
    return _email_service

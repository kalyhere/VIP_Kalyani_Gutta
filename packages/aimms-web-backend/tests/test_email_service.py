"""
Unit tests for the email service module using fastapi-mail.
"""

import pytest
import os
from unittest.mock import Mock, patch, AsyncMock
from backend.email_service import MimecastEmailService


class TestMimecastEmailService:
    """Test cases for MimecastEmailService class."""

    @pytest.fixture
    def email_service(self):
        """Create an email service instance with test configuration."""
        with patch.dict(os.environ, {
            'SMTP_HOST': 'smtp.test.com',
            'SMTP_HOST_FALLBACK': 'smtp-fallback.test.com',
            'SMTP_PORT': '587',
            'SMTP_USERNAME': 'test@arizona.edu',
            'SMTP_PASSWORD': 'test_password',
            'SMTP_FROM_EMAIL': 'test@arizona.edu',
            'SMTP_FROM_NAME': 'Test Platform'
        }):
            return MimecastEmailService()

    def test_initialization(self, email_service):
        """Test that email service initializes with correct configuration."""
        assert email_service.smtp_host == 'smtp.test.com'
        assert email_service.smtp_host_fallback == 'smtp-fallback.test.com'
        assert email_service.smtp_port == 587
        assert email_service.smtp_username == 'test@arizona.edu'
        assert email_service.smtp_from_email == 'test@arizona.edu'
        assert email_service.is_configured is True

    def test_initialization_without_password(self):
        """Test that service detects missing password."""
        with patch.dict(os.environ, {
            'SMTP_PASSWORD': ''
        }, clear=True):
            service = MimecastEmailService()
            assert service.is_configured is False

    def test_connection_config(self, email_service):
        """Test that ConnectionConfig is created correctly."""
        assert email_service.primary_config.MAIL_SERVER == 'smtp.test.com'
        assert email_service.fallback_config.MAIL_SERVER == 'smtp-fallback.test.com'
        assert email_service.primary_config.MAIL_PORT == 587
        assert email_service.primary_config.MAIL_STARTTLS is True
        assert email_service.primary_config.MAIL_SSL_TLS is False

    @pytest.mark.asyncio
    async def test_send_email_not_configured(self):
        """Test that sending fails when SMTP is not configured."""
        with patch.dict(os.environ, {'SMTP_PASSWORD': ''}, clear=True):
            service = MimecastEmailService()
            result = await service.send_email(
                to_email='test@arizona.edu',
                subject='Test',
                html_body='<p>Test</p>'
            )
            assert result is False

    @pytest.mark.asyncio
    async def test_send_email_success_primary(self, email_service):
        """Test successful email sending via primary server."""
        mock_send = AsyncMock()
        email_service.primary_mail.send_message = mock_send

        result = await email_service.send_email(
            to_email='recipient@arizona.edu',
            subject='Test Email',
            html_body='<p>Test content</p>'
        )

        assert result is True
        mock_send.assert_called_once()

        # Verify the MessageSchema was created correctly
        call_args = mock_send.call_args[0][0]
        assert call_args.subject == 'Test Email'
        assert 'recipient@arizona.edu' in call_args.recipients
        assert call_args.body == '<p>Test content</p>'

    @pytest.mark.asyncio
    async def test_send_email_failover_to_secondary(self, email_service):
        """Test automatic failover to secondary server on primary failure."""
        # Mock primary to fail
        email_service.primary_mail.send_message = AsyncMock(
            side_effect=Exception('Connection failed')
        )

        # Mock fallback to succeed
        email_service.fallback_mail.send_message = AsyncMock()

        result = await email_service.send_email(
            to_email='recipient@arizona.edu',
            subject='Test Email',
            html_body='<p>Test content</p>'
        )

        assert result is True
        email_service.primary_mail.send_message.assert_called_once()
        email_service.fallback_mail.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_both_servers_fail(self, email_service):
        """Test that sending returns False when both servers fail."""
        # Mock both servers to fail
        email_service.primary_mail.send_message = AsyncMock(
            side_effect=Exception('Connection failed')
        )
        email_service.fallback_mail.send_message = AsyncMock(
            side_effect=Exception('Fallback failed')
        )

        result = await email_service.send_email(
            to_email='recipient@arizona.edu',
            subject='Test Email',
            html_body='<p>Test content</p>'
        )

        assert result is False
        email_service.primary_mail.send_message.assert_called_once()
        email_service.fallback_mail.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_share_link_email(self, email_service):
        """Test send_share_link_email convenience method."""
        mock_send_template = AsyncMock(return_value=True)

        with patch.object(email_service, 'send_email_with_template', mock_send_template):
            result = await email_service.send_share_link_email(
                to_email='recipient@arizona.edu',
                report_name='Test Report',
                report_score=90.0,
                share_link='https://example.com/share/test',
                expires_at='2025-12-31',
                sender_name='Dr. Test',
                custom_message='Review this.'
            )

            assert result is True
            mock_send_template.assert_called_once()

            # Check the call arguments
            call_kwargs = mock_send_template.call_args[1]
            assert call_kwargs['to_email'] == 'recipient@arizona.edu'
            assert call_kwargs['subject'] == 'AIMHEI Report Shared: Test Report'
            assert call_kwargs['template_name'] == 'share_link.html'

            template_body = call_kwargs['template_body']
            assert template_body['report_name'] == 'Test Report'
            assert template_body['report_score'] == 90.0
            assert template_body['sender_name'] == 'Dr. Test'
            assert template_body['custom_message'] == 'Review this.'

    @pytest.mark.asyncio
    async def test_test_connection_success(self, email_service):
        """Test SMTP connection test method."""
        result = await email_service.test_connection()
        assert result is True

    @pytest.mark.asyncio
    async def test_test_connection_not_configured(self):
        """Test connection test when SMTP not configured."""
        with patch.dict(os.environ, {'SMTP_PASSWORD': ''}, clear=True):
            service = MimecastEmailService()
            result = await service.test_connection()
            assert result is False


def test_get_email_service_singleton():
    """Test that get_email_service returns the same instance."""
    from backend.email_service import get_email_service

    service1 = get_email_service()
    service2 = get_email_service()

    assert service1 is service2

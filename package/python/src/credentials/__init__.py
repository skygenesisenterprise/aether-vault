"""Aether Vault credentials models.

Defines various credential types for different services and protocols.
"""

import asyncio
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, AsyncContextManager
from enum import Enum

from pydantic import BaseModel, Field

from ..exceptions import TTLExpiredError


class CredentialType(str, Enum):
    """Types of credentials."""

    DATABASE = "database"
    API = "api"
    TLS = "tls"
    SMTP = "smtp"
    SSH = "ssh"
    CUSTOM = "custom"


class Credentials(BaseModel, ABC):
    """Base credential class."""

    type: CredentialType
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    ttl: timedelta
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def __init__(self, **data: Any) -> None:
        if "expires_at" not in data and "ttl" in data:
            ttl = data["ttl"]
            if isinstance(ttl, (int, float)):
                ttl = timedelta(seconds=ttl)
            created_at = data.get("created_at", datetime.utcnow())
            if isinstance(created_at, (int, float)):
                created_at = datetime.fromtimestamp(created_at)
            data["expires_at"] = created_at + ttl
        super().__init__(**data)

    @property
    def is_expired(self) -> bool:
        """Check if the credentials have expired."""
        return datetime.utcnow() > self.expires_at

    @property
    def time_to_expiry(self) -> timedelta:
        """Get time remaining until expiry."""
        if self.is_expired:
            return timedelta(0)
        return self.expires_at - datetime.utcnow()

    def validate_ttl(self) -> None:
        """Validate that the credentials are not expired."""
        if self.is_expired:
            raise TTLExpiredError(
                f"Credentials {self.name} expired at {self.expires_at.isoformat()}"
            )

    @abstractmethod
    async def connect(self) -> AsyncContextManager[Any]:
        """Create a connection using these credentials."""
        pass

    @abstractmethod
    async def revoke(self) -> None:
        """Revoke these credentials."""
        pass


class DatabaseCredentials(Credentials):
    """Database connection credentials."""

    type: CredentialType = CredentialType.DATABASE
    host: str
    port: int = Field(default=5432)
    database: str
    username: str
    password: str
    ssl_mode: str = Field(default="require")
    connection_params: Dict[str, Any] = Field(default_factory=dict)

    async def connect(self) -> AsyncContextManager[Any]:
        """Create a database connection."""
        try:
            import asyncpg
        except ImportError:
            raise ImportError("asyncpg is required for database connections")

        self.validate_ttl()

        @asynccontextmanager
        async def _db_connection():
            conn = await asyncpg.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password,
                ssl=self.ssl_mode,
                **self.connection_params,
            )
            try:
                yield conn
            finally:
                await conn.close()

        from contextlib import asynccontextmanager

        return _db_connection()

    async def revoke(self) -> None:
        """Revoke database credentials."""
        # Implementation would call Vault to revoke/rotate credentials
        pass


class APICredentials(Credentials):
    """API authentication credentials."""

    type: CredentialType = CredentialType.API
    base_url: str
    api_key: str
    auth_type: str = Field(default="bearer")
    headers: Dict[str, str] = Field(default_factory=dict)

    async def connect(self) -> AsyncContextManager[Any]:
        """Create an API client session."""
        import aiohttp

        self.validate_ttl()

        @asynccontextmanager
        async def _api_session():
            headers = {"Authorization": f"{self.auth_type} {self.api_key}"}
            headers.update(self.headers)

            async with aiohttp.ClientSession(
                base_url=self.base_url, headers=headers
            ) as session:
                yield session

        from contextlib import asynccontextmanager

        return _api_session()

    async def revoke(self) -> None:
        """Revoke API credentials."""
        pass


class TLSCredentials(Credentials):
    """TLS certificate credentials."""

    type: CredentialType = CredentialType.TLS
    certificate: str
    private_key: str
    ca_certificate: Optional[str] = None
    chain_certificates: list[str] = Field(default_factory=list)

    async def connect(self) -> AsyncContextManager[Any]:
        """Create a TLS context."""
        import ssl

        self.validate_ttl()

        @asynccontextmanager
        async def _tls_context():
            ssl_context = ssl.create_default_context()

            # Load certificate and private key
            ssl_context.load_cert_chain(
                certfile=self.certificate, keyfile=self.private_key
            )

            # Load CA certificate if provided
            if self.ca_certificate:
                ssl_context.load_verify_locations(cafile=self.ca_certificate)

            yield ssl_context

        from contextlib import asynccontextmanager

        return _tls_context()

    async def revoke(self) -> None:
        """Revoke TLS credentials."""
        pass


class SMTPCredentials(Credentials):
    """SMTP server credentials."""

    type: CredentialType = CredentialType.SMTP
    host: str
    port: int = Field(default=587)
    username: str
    password: str
    use_tls: bool = Field(default=True)
    use_ssl: bool = Field(default=False)

    async def connect(self) -> AsyncContextManager[Any]:
        """Create an SMTP connection."""
        import aiosmtplib

        self.validate_ttl()

        @asynccontextmanager
        async def _smtp_connection():
            smtp = aiosmtplib.SMTP(
                hostname=self.host,
                port=self.port,
                use_tls=self.use_tls,
                use_ssl=self.use_ssl,
            )

            await smtp.connect()
            await smtp.login(self.username, self.password)

            try:
                yield smtp
            finally:
                await smtp.quit()

        from contextlib import asynccontextmanager

        return _smtp_connection()

    async def revoke(self) -> None:
        """Revoke SMTP credentials."""
        pass


class SSHCredentials(Credentials):
    """SSH connection credentials."""

    type: CredentialType = CredentialType.SSH
    host: str
    port: int = Field(default=22)
    username: str
    private_key: str
    private_key_password: Optional[str] = None
    known_hosts: Optional[str] = None

    async def connect(self) -> AsyncContextManager[Any]:
        """Create an SSH connection."""
        try:
            import asyncssh
        except ImportError:
            raise ImportError("asyncssh is required for SSH connections")

        self.validate_ttl()

        @asynccontextmanager
        async def _ssh_connection():
            conn = await asyncssh.connect(
                host=self.host,
                port=self.port,
                username=self.username,
                client_keys=[self.private_key],
                passphrase=self.private_key_password,
                known_hosts=self.known_hosts
                if self.known_hosts
                else asyncssh.IGNORE_KNOWN_HOSTS,
            )

            try:
                yield conn
            finally:
                conn.close()
                await conn.wait_closed()

        from contextlib import asynccontextmanager

        return _ssh_connection()

    async def revoke(self) -> None:
        """Revoke SSH credentials."""
        pass

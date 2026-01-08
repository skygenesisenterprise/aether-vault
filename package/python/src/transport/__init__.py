"""Aether Vault transport layer.

Handles communication with Vault via different transport mechanisms.
"""

import asyncio
import json
import socket
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from enum import Enum

import aiohttp
from pydantic import BaseModel

from ..exceptions import ConnectionError, TransportError, AuthenticationError


class TransportType(str, Enum):
    """Types of transport mechanisms."""

    IPC = "ipc"
    HTTP = "http"
    HTTPS = "https"


class TransportConfig(BaseModel):
    """Base transport configuration."""

    type: TransportType
    timeout: timedelta = Field(default_factory=lambda: timedelta(seconds=30))
    retry_attempts: int = Field(default=3)
    retry_delay: timedelta = Field(default_factory=lambda: timedelta(seconds=1))


class IPCConfig(TransportConfig):
    """IPC transport configuration."""

    type: TransportType = TransportType.IPC
    socket_path: str = Field(default="/tmp/aether-vault.sock")
    socket_permissions: str = Field(default="600")


class HTTPConfig(TransportConfig):
    """HTTP/HTTPS transport configuration."""

    type: TransportType = TransportType.HTTP
    base_url: str
    api_key: Optional[str] = None
    verify_ssl: bool = Field(default=True)
    headers: Dict[str, str] = Field(default_factory=dict)

    def __init__(self, **data: Any) -> None:
        if "type" not in data:
            data["type"] = (
                TransportType.HTTPS
                if data.get("base_url", "").startswith("https://")
                else TransportType.HTTP
            )
        super().__init__(**data)


class TransportResponse(BaseModel):
    """Transport response wrapper."""

    status_code: int
    data: Any = None
    headers: Dict[str, str] = Field(default_factory=dict)
    success: bool = Field(default=True)
    error: Optional[str] = None


class Transport(ABC):
    """Abstract base class for transport implementations."""

    def __init__(self, config: TransportConfig) -> None:
        self.config = config
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    @abstractmethod
    async def connect(self) -> None:
        """Establish connection to Vault."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close connection to Vault."""
        pass

    @abstractmethod
    async def send_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> TransportResponse:
        """Send request to Vault."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if Vault is accessible."""
        pass


class IPCTransport(Transport):
    """IPC transport implementation using Unix domain sockets."""

    def __init__(self, config: IPCConfig) -> None:
        super().__init__(config)
        self.ipc_config = config
        self._reader: Optional[asyncio.StreamReader] = None
        self._writer: Optional[asyncio.StreamWriter] = None

    async def connect(self) -> None:
        """Connect to Unix domain socket."""
        try:
            self._reader, self._writer = await asyncio.open_unix_connection(
                self.ipc_config.socket_path
            )
        except (FileNotFoundError, ConnectionRefusedError) as e:
            raise ConnectionError(
                f"Failed to connect to IPC socket {self.ipc_config.socket_path}: {e}"
            )
        except OSError as e:
            raise ConnectionError(f"IPC socket error: {e}")

    async def close(self) -> None:
        """Close IPC connection."""
        if self._writer:
            self._writer.close()
            await self._writer.wait_closed()
            self._writer = None
            self._reader = None

    async def send_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> TransportResponse:
        """Send request over IPC socket."""
        if not self._writer or not self._reader:
            raise ConnectionError("IPC connection not established")

        request = {
            "method": method,
            "endpoint": endpoint,
            "data": data or {},
            "headers": headers or {},
            "timestamp": datetime.utcnow().isoformat(),
        }

        message = json.dumps(request) + "\n"

        try:
            self._writer.write(message.encode())
            await self._writer.drain()

            response_line = await self._reader.readline()
            if not response_line:
                raise TransportError("No response from IPC socket")

            response_data = json.loads(response_line.decode().strip())

            return TransportResponse(
                status_code=response_data.get("status_code", 200),
                data=response_data.get("data"),
                headers=response_data.get("headers", {}),
                success=response_data.get("success", True),
                error=response_data.get("error"),
            )
        except (ConnectionResetError, asyncio.IncompleteReadError) as e:
            raise TransportError(f"IPC transport error: {e}")
        except json.JSONDecodeError as e:
            raise TransportError(f"Invalid JSON response: {e}")

    async def health_check(self) -> bool:
        """Check IPC health."""
        try:
            response = await self.send_request("GET", "/health")
            return response.success and response.status_code == 200
        except Exception:
            return False


class HTTPTransport(Transport):
    """HTTP/HTTPS transport implementation."""

    def __init__(self, config: HTTPConfig) -> None:
        super().__init__(config)
        self.http_config = config

    async def connect(self) -> None:
        """Create HTTP session."""
        connector = aiohttp.TCPConnector(
            verify_ssl=self.http_config.verify_ssl,
        )

        timeout = aiohttp.ClientTimeout(total=self.config.timeout.total_seconds())

        self._session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers=self.http_config.headers,
        )

    async def close(self) -> None:
        """Close HTTP session."""
        if self._session:
            await self._session.close()
            self._session = None

    async def send_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> TransportResponse:
        """Send HTTP request."""
        if not self._session:
            raise ConnectionError("HTTP session not established")

        url = f"{self.http_config.base_url.rstrip('/')}/{endpoint.lstrip('/')}"

        request_headers = {}
        if self.http_config.api_key:
            request_headers["Authorization"] = f"Bearer {self.http_config.api_key}"
        if headers:
            request_headers.update(headers)

        for attempt in range(self.config.retry_attempts):
            try:
                async with self._session.request(
                    method=method,
                    url=url,
                    json=data,
                    headers=request_headers,
                ) as response:
                    response_data = None
                    if response.content_type == "application/json":
                        response_data = await response.json()
                    else:
                        response_text = await response.text()
                        if response_text:
                            try:
                                response_data = json.loads(response_text)
                            except json.JSONDecodeError:
                                response_data = {"text": response_text}

                    success = 200 <= response.status < 300

                    if not success:
                        if response.status == 401:
                            raise AuthenticationError(
                                "Invalid API key or authentication failed"
                            )
                        elif (
                            response.status >= 500
                            and attempt < self.config.retry_attempts - 1
                        ):
                            await asyncio.sleep(self.config.retry_delay.total_seconds())
                            continue

                    return TransportResponse(
                        status_code=response.status,
                        data=response_data,
                        headers=dict(response.headers),
                        success=success,
                        error=response_data.get("error")
                        if response_data
                        else f"HTTP {response.status}",
                    )
            except aiohttp.ClientError as e:
                if attempt == self.config.retry_attempts - 1:
                    raise TransportError(f"HTTP request failed: {e}")
                await asyncio.sleep(self.config.retry_delay.total_seconds())

        raise TransportError("All retry attempts failed")

    async def health_check(self) -> bool:
        """Check HTTP health."""
        try:
            response = await self.send_request("GET", "/health")
            return response.success and response.status_code == 200
        except Exception:
            return False


def create_transport(config: Union[IPCConfig, HTTPConfig]) -> Transport:
    """Create appropriate transport instance based on configuration."""
    if isinstance(config, IPCConfig):
        return IPCTransport(config)
    elif isinstance(config, HTTPConfig):
        return HTTPTransport(config)
    else:
        raise ValueError(f"Unsupported transport config type: {type(config)}")

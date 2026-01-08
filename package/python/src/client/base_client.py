"""Base client interface for Aether Vault SDK."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Union
from ..policy import Context, Intention
from ..exceptions import AetherVaultError


class BaseClient(ABC):
    """Abstract base class for Aether Vault clients."""

    def __init__(self, endpoint: str, timeout: int = 30) -> None:
        """Initialize base client.

        Args:
            endpoint: Vault service endpoint
            timeout: Request timeout in seconds
        """
        self.endpoint = endpoint
        self.timeout = timeout
        self._authenticated = False

    @abstractmethod
    async def authenticate(self, credentials: Any) -> bool:
        """Authenticate with the vault.

        Args:
            credentials: Authentication credentials

        Returns:
            True if authentication successful

        Raises:
            AuthenticationError: If authentication fails
        """
        pass

    @abstractmethod
    async def request(
        self,
        intention: Intention,
        context: Optional[Context] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Make a request to the vault.

        Args:
            intention: Security intention for the request
            context: Security context
            data: Request data

        Returns:
            Response from vault

        Raises:
            AetherVaultError: If request fails
        """
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close the client connection."""
        pass

    @property
    def is_authenticated(self) -> bool:
        """Check if client is authenticated."""
        return self._authenticated

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self.close()

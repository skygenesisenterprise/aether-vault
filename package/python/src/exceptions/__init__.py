"""Aether Vault exceptions.

Custom exception hierarchy for Aether Vault Python SDK.
"""


class AetherVaultError(Exception):
    """Base exception for all Aether Vault errors."""

    def __init__(self, message: str, details: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ConnectionError(AetherVaultError):
    """Raised when connection to Vault fails."""

    pass


class AuthenticationError(AetherVaultError):
    """Raised when authentication fails."""

    pass


class TransportError(AetherVaultError):
    """Raised when transport layer error occurs."""

    pass


class PolicyError(AetherVaultError):
    """Raised when policy validation fails."""

    pass


class CapabilityError(AetherVaultError):
    """Raised when capability request fails."""

    pass


class SecretError(AetherVaultError):
    """Raised when secret operation fails."""

    pass


class TTLExpiredError(AetherVaultError):
    """Raised when TTL has expired for a credential."""

    pass

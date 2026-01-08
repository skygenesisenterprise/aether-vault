"""Aether Vault Python SDK.

Security & Secrets Operating System SDK for enterprise use.
Provides secure access to Aether Vault via local agent (IPC) or remote connection.
"""

from .client import VaultClient, create_vault_client
from .exceptions import (
    AetherVaultError,
    AuthenticationError,
    CapabilityError,
    ConnectionError,
    PolicyError,
    SecretError,
    TTLExpiredError,
    TransportError,
)
from .policy import Context, Intention, Policy, Capability
from .credentials import (
    Credentials,
    DatabaseCredentials,
    TLSCredentials,
    SMTPCredentials,
)

__version__ = "0.1.0"
__author__ = "Sky Genesis Enterprise"
__email__ = "developer@skygenesisenterprise.com"

__all__ = [
    # Core client
    "VaultClient",
    "create_vault_client",
    # Exceptions
    "AetherVaultError",
    "AuthenticationError",
    "CapabilityError",
    "ConnectionError",
    "PolicyError",
    "SecretError",
    "TTLExpiredError",
    "TransportError",
    # Policy & Security
    "Context",
    "Intention",
    "Policy",
    "Capability",
    # Credentials
    "Credentials",
    "DatabaseCredentials",
    "TLSCredentials",
    "SMTPCredentials",
]

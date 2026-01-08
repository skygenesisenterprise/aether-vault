"""Aether Vault policy and security models.

Defines the security policy framework for capability-based access.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field


class Intention(str, Enum):
    """Types of intentions for capability requests."""

    DATABASE_READ = "database:read"
    DATABASE_WRITE = "database:write"
    DATABASE_ADMIN = "database:admin"
    API_READ = "api:read"
    API_WRITE = "api:write"
    API_ADMIN = "api:admin"
    SECRET_READ = "secret:read"
    SECRET_WRITE = "secret:write"
    SECRET_ROTATE = "secret:rotate"
    FILE_READ = "file:read"
    FILE_WRITE = "file:write"
    SYSTEM_ADMIN = "system:admin"


class Context(BaseModel):
    """Security context for capability requests."""

    user_id: Optional[str] = None
    service_id: Optional[str] = None
    environment: str = Field(default="production")
    region: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Policy(BaseModel):
    """Security policy definition."""

    id: str
    name: str
    description: Optional[str] = None
    intentions: List[Intention]
    constraints: Dict[str, Any] = Field(default_factory=dict)
    ttl_limits: Dict[str, timedelta] = Field(default_factory=dict)
    required_context: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1


class Capability(BaseModel):
    """Granted capability with specific permissions and constraints."""

    id: str
    intention: Intention
    context: Context
    policy_id: str
    ttl: timedelta
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    constraints: Dict[str, Any] = Field(default_factory=dict)
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
        """Check if the capability has expired."""
        return datetime.utcnow() > self.expires_at

    @property
    def time_to_expiry(self) -> timedelta:
        """Get time remaining until expiry."""
        if self.is_expired:
            return timedelta(0)
        return self.expires_at - datetime.utcnow()

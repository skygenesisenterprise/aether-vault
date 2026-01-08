# Aether Vault Python SDK

Aether Vault est un Security & Secrets Operating System open-source. Le SDK Python permet d'interagir avec Aether Vault de manière sécurisée, en priorité via l'agent local (IPC) et optionnellement avec un Vault distant.

## Installation

```bash
pip install aether-vault
```

## Usage Basique

```python
from aether_vault import create_vault_client

# Créer un client Vault (utilise l'agent local par défaut)
vault = create_vault_client()

# Demander une capability pour accéder à une base de données
db_creds = await vault.database.get_credentials(
    database="postgres-prod",
    role="read-only",
    ttl="5m"
)

# Utiliser les credentials de manière sécurisée
async with db_creds.connect() as conn:
    result = await conn.execute("SELECT * FROM users LIMIT 10")
```

## Principes de Conception

- **Sécurité d'abord** : Aucun secret long-lived, TTL obligatoire
- **Transport abstrait** : IPC local prioritaire, remote optionnel
- **Orienté intention** : Demander des capabilities, pas des secrets
- **Pas de stockage persistant** : Les credentials restent en mémoire
- **Auditabilité** : Toutes les requêtes sont traçables

## Documentation

Voir la [documentation complète](https://aether-vault.skygenesis.com) pour:

- Guide d'installation et configuration
- Référence API complète
- Exemples avancés (CI/CD, production, enterprise)
- Architecture interne et extensions

## License

MIT License - voir [LICENSE](LICENSE) pour les détails.

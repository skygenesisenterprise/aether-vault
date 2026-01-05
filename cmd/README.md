# Aether Vault CMD

Console système interactive pour Aether Vault - appliance Debian bootable.

## 🚀 Installation

```bash
# Compiler le binaire
make build

# Installer en tant que service
sudo make install
```

## 📖 Utilisation

### Mode interactif (par défaut)

```bash
sudo vaultctl
```

### Mode commande

```bash
vaultctl status
vaultctl service list
vaultctl network interfaces
```

## 🏗️ Architecture

Le dossier `cmd/` est organisé comme suit :

- `vaultctl/` - Binaire principal et commandes CLI
- `internal/` - Packages internes (non importables)
  - `banner/` - ASCII art et infos système
  - `menu/` - Menus interactifs
  - `actions/` - Actions exécutables
  - `context/` - État global de la session
  - `ui/` - Rendering CLI
  - `auth/` - Authentification locale
  - `config/` - Configuration
  - `utils/` - Utilitaires système
- `pkg/` - Packages publics réutilisables
- `configs/` - Fichiers de configuration
- `scripts/` - Scripts d'installation

## 🔧 Développement

```bash
# Lancer en mode développement
make dev

# Tester
make test

# Linter
make lint
```

## 📚 Documentation

Voir `docs/` pour la documentation complète :

- `API.md` - Documentation API interne
- `DEVELOPMENT.md` - Guide de développement
- `DEPLOYMENT.md` - Guide de déploiement

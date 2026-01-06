# Aether Vault Docker Configuration

This directory contains Docker configuration files for the Aether Vault API server.

## Files

- `Dockerfile` - Multi-stage build configuration for the Go API server
- `docker-compose.yml` - Complete stack with API, PostgreSQL, Redis, and Nginx
- `.dockerignore` - Files to exclude from Docker build context

## Quick Start

### Development

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f api
```

### Production

```bash
# Use production compose file
docker-compose -f docker-compose.yml up -d --build

# Scale API servers
docker-compose up -d --build --scale api=3
```

## Services

### API Server

- **Port**: 8080
- **Health Check**: `/health`
- **Environment**: Configurable via docker-compose.yml

### PostgreSQL

- **Port**: 5432
- **Database**: aether_vault
- **User**: aether
- **Password**: Set in docker-compose.yml

### Redis

- **Port**: 6379
- **Password**: Set in docker-compose.yml
- **Persistence**: Enabled

### Nginx (Optional)

- **Ports**: 80, 443
- **SSL**: Mount certificates in `./ssl` directory

## Configuration

### Environment Variables

Key environment variables in docker-compose.yml:

```yaml
environment:
  - SERVER_HOST=0.0.0.0
  - SERVER_PORT=8080
  - DATABASE_HOST=postgres
  - REDIS_HOST=redis
  - JWT_SECRET=your-secret-key
  - SECURITY_ENCRYPTION_KEY=your-encryption-key
```

### Volumes

- `./logs:/app/logs` - Application logs
- `./uploads:/app/uploads` - File uploads
- `postgres_data:/var/lib/postgresql/data` - Database data
- `redis_data:/data` - Redis data

## Security Notes

⚠️ **Important**: Change default passwords and secrets in production:

1. Database password in postgres environment
2. Redis password in redis command
3. JWT_SECRET and SECURITY_ENCRYPTION_KEY in api environment
4. SSL certificates for nginx

## Health Checks

All services include health checks:

- API: HTTP endpoint `/health`
- PostgreSQL: `pg_isready` command
- Redis: `redis-cli ping` command
- Nginx: HTTP endpoint `/health`

## Monitoring

### View Service Status

```bash
docker-compose ps
```

### View Resource Usage

```bash
docker stats
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
```

## Backup and Restore

### Database Backup

```bash
docker-compose exec postgres pg_dump -U aether aether_vault > backup.sql
```

### Database Restore

```bash
docker-compose exec -T postgres psql -U aether aether_vault < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8080, 5432, 6379 are available
2. **Permission issues**: Check volume permissions
3. **Database connection**: Verify network and credentials
4. **Memory limits**: Monitor container resource usage

### Reset Everything

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (⚠️ deletes all data)
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

## Production Deployment

For production deployment:

1. Use environment-specific compose files
2. Configure proper SSL certificates
3. Set up monitoring and logging
4. Configure backup strategies
5. Use secrets management for sensitive data
6. Set up proper resource limits
7. Configure network policies

### Example Production Compose

```bash
# Create production override file
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
EOF

# Deploy with override
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

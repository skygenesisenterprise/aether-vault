# Build stage
FROM composer:2.6 AS builder

WORKDIR /app

# Copy composer files
COPY composer.json ./

# Generate composer.lock if it doesn't exist
RUN composer install --no-interaction --optimize-autoloader

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Production stage
FROM php:8.2-fpm-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    unzip \
    libzip-dev \
    && docker-php-ext-install zip \
    && docker-php-ext-enable zip

# Install and configure Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Create non-root user
RUN addgroup -g 1001 -S php && \
    adduser -S php -u 1001

WORKDIR /var/www/html

# Copy built application from builder stage
COPY --from=builder /app/vendor ./vendor
COPY --from=builder /app/vendor/autoload.php ./

# Copy application source
COPY --chown=php:php src/ ./src/

# Copy composer.json for autoloading
COPY --chown=php:php composer.json ./

# Generate optimized autoloader
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

# Switch to non-root user
USER php

# Set environment variables
ENV APP_ENV=production
ENV APP_DEBUG=false

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD php -r "echo 'Aether Vault PHP SDK is healthy';" || exit 1

# Expose port for PHP-FPM
EXPOSE 9000

# Default command
CMD ["php-fpm"]
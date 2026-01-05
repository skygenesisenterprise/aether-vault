package main

import (
	"fmt"
	"github.com/skygenesisenterprise/aether-vault/server/src/config"
	"github.com/skygenesisenterprise/aether-vault/server/src/model"
	"github.com/skygenesisenterprise/aether-vault/server/src/routes"
	"github.com/skygenesisenterprise/aether-vault/server/src/services"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	var db *gorm.DB
	var userService *services.UserService
	var auditService *services.AuditService
	var secretService *services.SecretService
	var totpService *services.TOTPService
	var policyService *services.PolicyService

	// Initialize database if available (optional in development)
	if cfg.Server.Environment == "production" || (cfg.Database.Host != "" && cfg.Database.User != "") {
		db, err = initDatabase(cfg.Database)
		if err != nil {
			if cfg.Server.Environment == "production" {
				log.Fatalf("Failed to initialize database in production: %v", err)
			} else {
				log.Printf("⚠️  Database connection failed, running in development mode without database: %v", err)
				log.Printf("⚠️  Features requiring database will be disabled")
			}
		}

		if db != nil {
			if err := migrateDatabase(db); err != nil {
				if cfg.Server.Environment == "production" {
					log.Fatalf("Failed to migrate database in production: %v", err)
				} else {
					log.Printf("⚠️  Database migration failed, running without database: %v", err)
					db = nil
				}
			}
		}
	}

	// Initialize services
	if db != nil {
		// Full database-backed services
		userService = services.NewUserService(db)
		auditService = services.NewAuditService(db)
		secretService = services.NewSecretService(db, cfg.Security.EncryptionKey, "default-salt", cfg.Security.KDFIterations, auditService)
		totpService = services.NewTOTPService(db, auditService)
		policyService = services.NewPolicyService(db)
		log.Printf("✅ Database-backed services initialized")
	} else {
		// Mock services for development
		log.Printf("🔧 Initializing mock services for development")
		// We'll need to create mock services - for now, let's create nil services
		// and handle this in the routes/controllers
	}

	// Always initialize auth service (can work with mock user service)
	authService := services.NewAuthService(userService, &cfg.JWT)

	router := routes.NewRouter(db, authService, secretService, totpService, userService, policyService, auditService)
	router.SetupRoutes()

	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:      router.GetEngine(),
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
	}

	log.Printf("Aether Vault API server starting on %s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Environment: %s", cfg.Server.Environment)

	if db != nil {
		log.Printf("Database: %s:%d/%s (connected)", cfg.Database.Host, cfg.Database.Port, cfg.Database.DBName)
	} else {
		log.Printf("Database: not connected (development mode)")
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func initDatabase(dbConfig config.DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=%s",
		dbConfig.Host,
		dbConfig.User,
		dbConfig.Password,
		dbConfig.DBName,
		dbConfig.Port,
		dbConfig.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

func migrateDatabase(db *gorm.DB) error {
	return db.AutoMigrate(
		&model.User{},
		&model.Secret{},
		&model.TOTP{},
		&model.Policy{},
		&model.AuditLog{},
	)
}

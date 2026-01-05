package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Security SecurityConfig `mapstructure:"security"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	Audit    AuditConfig    `mapstructure:"audit"`
}

type ServerConfig struct {
	Host         string `mapstructure:"host"`
	Port         int    `mapstructure:"port"`
	Environment  string `mapstructure:"environment"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	DBName   string `mapstructure:"dbname"`
	SSLMode  string `mapstructure:"sslmode"`
}

type SecurityConfig struct {
	EncryptionKey string `mapstructure:"encryption_key"`
	KDFIterations int    `mapstructure:"kdf_iterations"`
	SaltLength    int    `mapstructure:"salt_length"`
}

type JWTConfig struct {
	Secret     string `mapstructure:"secret"`
	Expiration int    `mapstructure:"expiration"`
}

type AuditConfig struct {
	Enabled   bool   `mapstructure:"enabled"`
	LogLevel  string `mapstructure:"log_level"`
	LogFormat string `mapstructure:"log_format"`
}

func LoadConfig() (*Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		fmt.Println("No .env file found, using environment variables")
	} else {
		fmt.Println("Loaded environment variables from .env file")
	}

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	viper.AutomaticEnv()
	viper.SetEnvPrefix("VAULT")

	setDefaults()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			fmt.Println("Config file not found, using defaults and environment variables")
		} else {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	validateConfig(&config)

	return &config, nil
}

func setDefaults() {
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.environment", "development")
	viper.SetDefault("server.read_timeout", 30)
	viper.SetDefault("server.write_timeout", 30)

	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.user", "vault")
	viper.SetDefault("database.dbname", "vault")
	viper.SetDefault("database.sslmode", "disable")

	viper.SetDefault("security.kdf_iterations", 100000)
	viper.SetDefault("security.salt_length", 32)

	viper.SetDefault("jwt.expiration", 3600)

	viper.SetDefault("audit.enabled", true)
	viper.SetDefault("audit.log_level", "info")
	viper.SetDefault("audit.log_format", "json")
}

func validateConfig(config *Config) {
	if config.Server.Port <= 0 || config.Server.Port > 65535 {
		panic("Invalid server port")
	}

	if config.Database.Host == "" {
		panic("Database host is required")
	}

	if config.Database.User == "" {
		panic("Database user is required")
	}

	if config.Database.DBName == "" {
		panic("Database name is required")
	}

	if config.JWT.Secret == "" {
		panic("JWT secret is required")
	}

	if config.Security.EncryptionKey == "" {
		panic("Encryption key is required")
	}
}

func GetEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

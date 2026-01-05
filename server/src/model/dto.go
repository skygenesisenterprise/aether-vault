package model

import (
	"time"

	"github.com/google/uuid"
)

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
	Database  string    `json:"database"`
}

type VersionResponse struct {
	Version   string `json:"version"`
	BuildTime string `json:"build_time"`
	GitCommit string `json:"git_commit"`
	GoVersion string `json:"go_version"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	User      User      `json:"user"`
}

type SessionResponse struct {
	User  User `json:"user"`
	Valid bool `json:"valid"`
}

type CreateSecretRequest struct {
	Name        string     `json:"name" binding:"required"`
	Description string     `json:"description"`
	Value       string     `json:"value" binding:"required"`
	Type        SecretType `json:"type" binding:"required"`
	Tags        string     `json:"tags"`
	ExpiresAt   *time.Time `json:"expires_at"`
}

type UpdateSecretRequest struct {
	Name        *string     `json:"name"`
	Description *string     `json:"description"`
	Value       *string     `json:"value"`
	Type        *SecretType `json:"type"`
	Tags        *string     `json:"tags"`
	ExpiresAt   *time.Time  `json:"expires_at"`
	IsActive    *bool       `json:"is_active"`
}

type CreateTOTPRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Secret      string `json:"secret"`
	Algorithm   string `json:"algorithm"`
	Digits      int    `json:"digits"`
	Period      int    `json:"period"`
}

type TOTPGenerateRequest struct {
	ID uuid.UUID `json:"id" binding:"required"`
}

type TOTPGenerateResponse struct {
	Code      string    `json:"code"`
	ExpiresAt time.Time `json:"expires_at"`
}

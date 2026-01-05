package middleware

import (
	"bytes"
	"fmt"
	"github.com/skygenesisenterprise/aether-vault/server/src/services"
	"io"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuditMiddleware struct {
	auditService *services.AuditService
}

func NewAuditMiddleware(auditService *services.AuditService) *AuditMiddleware {
	return &AuditMiddleware{
		auditService: auditService,
	}
}

func (m *AuditMiddleware) Audit() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		start := time.Now()

		requestID := uuid.New().String()
		ctx.Set("request_id", requestID)

		var body []byte
		if ctx.Request.Body != nil {
			body, _ = io.ReadAll(ctx.Request.Body)
			ctx.Request.Body = io.NopCloser(bytes.NewBuffer(body))
		}

		ctx.Next()

		duration := time.Since(start)
		statusCode := ctx.Writer.Status()

		userID, _ := ctx.Get("user_id")

		action := m.getActionFromRequest(ctx)
		resource := m.getResourceFromRequest(ctx)
		resourceID := m.getResourceIDFromRequest(ctx)

		success := statusCode < 400
		details := m.getAuditDetails(ctx, body, duration, statusCode)

		if uid, ok := userID.(uuid.UUID); ok {
			m.auditService.LogAction(uid, action, resource, resourceID, success, details)
		} else {
			m.auditService.LogAnonymousAction(action, resource, resourceID, ctx.ClientIP(), ctx.GetHeader("User-Agent"), success, details)
		}
	}
}

func (m *AuditMiddleware) getActionFromRequest(ctx *gin.Context) string {
	method := ctx.Request.Method
	path := ctx.Request.URL.Path

	switch {
	case method == "POST" && path == "/api/v1/auth/login":
		return "login"
	case method == "POST" && path == "/api/v1/auth/logout":
		return "logout"
	case method == "GET" && path == "/api/v1/auth/session":
		return "session_check"
	case method == "GET" && strings.Contains(path, "/api/v1/secrets"):
		return "secrets_accessed"
	case method == "POST" && strings.Contains(path, "/api/v1/secrets"):
		return "secret_created"
	case method == "PUT" && strings.Contains(path, "/api/v1/secrets"):
		return "secret_updated"
	case method == "DELETE" && strings.Contains(path, "/api/v1/secrets"):
		return "secret_deleted"
	case method == "GET" && strings.Contains(path, "/api/v1/totp"):
		return "totp_accessed"
	case method == "POST" && strings.Contains(path, "/api/v1/totp"):
		return "totp_created"
	case method == "POST" && strings.Contains(path, "/api/v1/totp") && strings.Contains(path, "/generate"):
		return "totp_code_generated"
	case method == "GET" && strings.Contains(path, "/api/v1/audit"):
		return "audit_accessed"
	default:
		return method + "_" + path
	}
}

func (m *AuditMiddleware) getResourceFromRequest(ctx *gin.Context) string {
	path := ctx.Request.URL.Path

	switch {
	case strings.Contains(path, "/auth/"):
		return "auth"
	case strings.Contains(path, "/secrets"):
		return "secret"
	case strings.Contains(path, "/totp"):
		return "totp"
	case strings.Contains(path, "/identity"):
		return "identity"
	case strings.Contains(path, "/audit"):
		return "audit"
	case strings.Contains(path, "/health"):
		return "system"
	case strings.Contains(path, "/version"):
		return "system"
	default:
		return "unknown"
	}
}

func (m *AuditMiddleware) getResourceIDFromRequest(ctx *gin.Context) string {
	id := ctx.Param("id")
	if id != "" {
		return id
	}
	return ""
}

func (m *AuditMiddleware) getAuditDetails(ctx *gin.Context, body []byte, duration time.Duration, statusCode int) string {
	details := map[string]interface{}{
		"method":      ctx.Request.Method,
		"path":        ctx.Request.URL.Path,
		"query":       ctx.Request.URL.RawQuery,
		"user_agent":  ctx.GetHeader("User-Agent"),
		"ip_address":  ctx.ClientIP(),
		"duration_ms": duration.Milliseconds(),
		"status_code": statusCode,
	}

	if len(body) > 0 && !m.isSensitiveEndpoint(ctx) {
		details["request_body"] = string(body)
	}

	return fmt.Sprintf("%+v", details)
}

func (m *AuditMiddleware) isSensitiveEndpoint(ctx *gin.Context) bool {
	path := ctx.Request.URL.Path
	method := ctx.Request.Method

	sensitiveEndpoints := map[string]bool{
		"POST:/api/v1/auth/login": true,
		"POST:/api/v1/secrets":    true,
		"PUT:/api/v1/secrets":     true,
	}

	key := method + ":" + path
	return sensitiveEndpoints[key]
}

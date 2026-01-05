package middleware

import (
	"github.com/skygenesisenterprise/aether-vault/server/src/model"
	"github.com/skygenesisenterprise/aether-vault/server/src/services"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	authService *services.AuthService
}

func NewAuthMiddleware(authService *services.AuthService) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
	}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			ctx.JSON(http.StatusUnauthorized, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "VAULT_MISSING_TOKEN",
					Message: "Authorization token required",
				},
			})
			ctx.Abort()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			ctx.JSON(http.StatusUnauthorized, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "VAULT_INVALID_TOKEN_FORMAT",
					Message: "Invalid token format. Expected: Bearer <token>",
				},
			})
			ctx.Abort()
			return
		}

		userID, err := m.authService.ValidateToken(tokenParts[1])
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "VAULT_INVALID_TOKEN",
					Message: "Invalid or expired token",
				},
			})
			ctx.Abort()
			return
		}

		ctx.Set("user_id", *userID)
		ctx.Next()
	}
}

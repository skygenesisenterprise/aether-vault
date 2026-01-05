package controllers

import (
	"github.com/skygenesisenterprise/aether-vault/server/src/model"
	"github.com/skygenesisenterprise/aether-vault/server/src/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SecretController struct {
	secretService *services.SecretService
}

func NewSecretController(secretService *services.SecretService) *SecretController {
	return &SecretController{
		secretService: secretService,
	}
}

func (c *SecretController) GetSecrets(ctx *gin.Context) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_UNAUTHORIZED",
				Message: "Unauthorized",
			},
		})
		return
	}

	secrets, err := c.secretService.GetSecretsByUserID(userID.(uuid.UUID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INTERNAL_ERROR",
				Message: "Failed to retrieve secrets",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"secrets": secrets})
}

func (c *SecretController) GetSecret(ctx *gin.Context) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_UNAUTHORIZED",
				Message: "Unauthorized",
			},
		})
		return
	}

	idParam := ctx.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INVALID_ID",
				Message: "Invalid secret ID",
			},
		})
		return
	}

	secret, err := c.secretService.GetSecretByID(id, userID.(uuid.UUID))
	if err != nil {
		if err == services.ErrSecretNotFound {
			ctx.JSON(http.StatusNotFound, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "VAULT_SECRET_NOT_FOUND",
					Message: "Secret not found",
				},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INTERNAL_ERROR",
				Message: "Failed to retrieve secret",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, secret)
}

func (c *SecretController) CreateSecret(ctx *gin.Context) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_UNAUTHORIZED",
				Message: "Unauthorized",
			},
		})
		return
	}

	var req model.CreateSecretRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INVALID_REQUEST",
				Message: "Invalid request format",
			},
		})
		return
	}

	secret := &model.Secret{
		Name:        req.Name,
		Description: req.Description,
		Value:       req.Value,
		Type:        req.Type,
		Tags:        req.Tags,
		ExpiresAt:   req.ExpiresAt,
		IsActive:    true,
	}

	if err := c.secretService.CreateSecret(secret, userID.(uuid.UUID)); err != nil {
		ctx.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INTERNAL_ERROR",
				Message: "Failed to create secret",
			},
		})
		return
	}

	ctx.JSON(http.StatusCreated, secret)
}

func (c *SecretController) UpdateSecret(ctx *gin.Context) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_UNAUTHORIZED",
				Message: "Unauthorized",
			},
		})
		return
	}

	idParam := ctx.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INVALID_ID",
				Message: "Invalid secret ID",
			},
		})
		return
	}

	var req model.UpdateSecretRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INVALID_REQUEST",
				Message: "Invalid request format",
			},
		})
		return
	}

	secret, err := c.secretService.UpdateSecret(id, &req, userID.(uuid.UUID))
	if err != nil {
		if err == services.ErrSecretNotFound {
			ctx.JSON(http.StatusNotFound, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "VAULT_SECRET_NOT_FOUND",
					Message: "Secret not found",
				},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INTERNAL_ERROR",
				Message: "Failed to update secret",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, secret)
}

func (c *SecretController) DeleteSecret(ctx *gin.Context) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_UNAUTHORIZED",
				Message: "Unauthorized",
			},
		})
		return
	}

	idParam := ctx.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INVALID_ID",
				Message: "Invalid secret ID",
			},
		})
		return
	}

	if err := c.secretService.DeleteSecret(id, userID.(uuid.UUID)); err != nil {
		if err == services.ErrSecretNotFound {
			ctx.JSON(http.StatusNotFound, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "VAULT_SECRET_NOT_FOUND",
					Message: "Secret not found",
				},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INTERNAL_ERROR",
				Message: "Failed to delete secret",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Secret deleted successfully"})
}

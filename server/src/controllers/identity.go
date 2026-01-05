package controllers

import (
	"github.com/skygenesisenterprise/aether-vault/server/src/model"
	"github.com/skygenesisenterprise/aether-vault/server/src/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type IdentityController struct {
	userService   *services.UserService
	policyService *services.PolicyService
}

func NewIdentityController(userService *services.UserService, policyService *services.PolicyService) *IdentityController {
	return &IdentityController{
		userService:   userService,
		policyService: policyService,
	}
}

func (c *IdentityController) GetMe(ctx *gin.Context) {
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

	user, err := c.userService.GetUserByID(userID.(uuid.UUID))
	if err != nil {
		if err == services.ErrUserNotFound {
			ctx.JSON(http.StatusNotFound, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "VAULT_USER_NOT_FOUND",
					Message: "User not found",
				},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INTERNAL_ERROR",
				Message: "Failed to retrieve user",
			},
		})
		return
	}

	user.Password = ""
	ctx.JSON(http.StatusOK, user)
}

func (c *IdentityController) GetPolicies(ctx *gin.Context) {
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

	policies, err := c.policyService.GetPoliciesByUserID(userID.(uuid.UUID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "VAULT_INTERNAL_ERROR",
				Message: "Failed to retrieve policies",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"policies": policies})
}

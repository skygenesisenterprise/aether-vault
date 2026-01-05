package services

import (
	"fmt"
	"github.com/skygenesisenterprise/aether-vault/server/src/config"
	"github.com/skygenesisenterprise/aether-vault/server/src/model"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type AuthService struct {
	userService *UserService
	config      *config.JWTConfig
}

func NewAuthService(userService *UserService, config *config.JWTConfig) *AuthService {
	return &AuthService{
		userService: userService,
		config:      config,
	}
}

func (s *AuthService) Login(email, password string) (*model.LoginResponse, error) {
	user, err := s.userService.GetUserByEmail(email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if !s.userService.ValidatePassword(user, password) {
		return nil, ErrInvalidCredentials
	}

	token, expiresAt, err := s.generateToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	response := &model.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      *user,
	}

	return response, nil
}

func (s *AuthService) ValidateToken(tokenString string) (*uuid.UUID, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userIDStr, ok := claims["user_id"].(string)
		if !ok {
			return nil, fmt.Errorf("invalid user ID in token")
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return nil, fmt.Errorf("invalid user ID format: %w", err)
		}

		return &userID, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func (s *AuthService) GetSession(userID uuid.UUID) (*model.SessionResponse, error) {
	user, err := s.userService.GetUserByID(userID)
	if err != nil {
		return &model.SessionResponse{
			Valid: false,
		}, nil
	}

	return &model.SessionResponse{
		User:  *user,
		Valid: true,
	}, nil
}

func (s *AuthService) generateToken(userID uuid.UUID) (string, time.Time, error) {
	expiresAt := time.Now().Add(time.Duration(s.config.Expiration) * time.Second)

	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     expiresAt.Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.Secret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}

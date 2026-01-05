package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/skygenesisenterprise/aether-vault/server/src/model"
	"io"

	"github.com/google/uuid"
	"golang.org/x/crypto/pbkdf2"
	"gorm.io/gorm"
)

type SecretService struct {
	db           *gorm.DB
	cryptoKey    []byte
	kdfSalt      []byte
	kdfIter      int
	auditService *AuditService
}

func NewSecretService(db *gorm.DB, encryptionKey string, kdfSalt string, kdfIter int, auditService *AuditService) *SecretService {
	salt := []byte(kdfSalt)
	key := pbkdf2.Key([]byte(encryptionKey), salt, kdfIter, 32, sha256.New)

	return &SecretService{
		db:           db,
		cryptoKey:    key,
		kdfSalt:      salt,
		kdfIter:      kdfIter,
		auditService: auditService,
	}
}

func (s *SecretService) CreateSecret(secret *model.Secret, userID uuid.UUID) error {
	encryptedValue, err := s.encrypt(secret.Value)
	if err != nil {
		return fmt.Errorf("failed to encrypt secret: %w", err)
	}

	valueHash := s.hashValue(secret.Value)

	secret.Value = encryptedValue
	secret.ValueHash = valueHash
	secret.UserID = userID

	if err := s.db.Create(secret).Error; err != nil {
		return fmt.Errorf("failed to create secret: %w", err)
	}

	if s.auditService != nil {
		s.auditService.LogAction(userID, "secret_created", "secret", secret.ID.String(), true, "")
	}

	return nil
}

func (s *SecretService) GetSecretByID(id uuid.UUID, userID uuid.UUID) (*model.Secret, error) {
	var secret model.Secret
	if err := s.db.Where("id = ? AND user_id = ? AND is_active = ?", id, userID, true).First(&secret).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSecretNotFound
		}
		return nil, fmt.Errorf("failed to get secret: %w", err)
	}

	decryptedValue, err := s.decrypt(secret.Value)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt secret: %w", err)
	}

	secret.Value = decryptedValue

	if s.auditService != nil {
		s.auditService.LogAction(userID, "secret_accessed", "secret", secret.ID.String(), true, "")
	}

	return &secret, nil
}

func (s *SecretService) GetSecretsByUserID(userID uuid.UUID) ([]model.Secret, error) {
	var secrets []model.Secret
	if err := s.db.Where("user_id = ? AND is_active = ?", userID, true).Find(&secrets).Error; err != nil {
		return nil, fmt.Errorf("failed to get secrets: %w", err)
	}

	for i := range secrets {
		decryptedValue, err := s.decrypt(secrets[i].Value)
		if err != nil {
			return nil, fmt.Errorf("failed to decrypt secret: %w", err)
		}
		secrets[i].Value = decryptedValue
	}

	if s.auditService != nil {
		s.auditService.LogAction(userID, "secrets_listed", "secret", "", true, "")
	}

	return secrets, nil
}

func (s *SecretService) UpdateSecret(id uuid.UUID, updates *model.UpdateSecretRequest, userID uuid.UUID) (*model.Secret, error) {
	var secret model.Secret
	if err := s.db.Where("id = ? AND user_id = ? AND is_active = ?", id, userID, true).First(&secret).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSecretNotFound
		}
		return nil, fmt.Errorf("failed to get secret: %w", err)
	}

	if updates.Name != nil {
		secret.Name = *updates.Name
	}
	if updates.Description != nil {
		secret.Description = *updates.Description
	}
	if updates.Value != nil {
		encryptedValue, err := s.encrypt(*updates.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt secret: %w", err)
		}
		secret.Value = encryptedValue
		secret.ValueHash = s.hashValue(*updates.Value)
	}
	if updates.Type != nil {
		secret.Type = *updates.Type
	}
	if updates.Tags != nil {
		secret.Tags = *updates.Tags
	}
	if updates.ExpiresAt != nil {
		secret.ExpiresAt = updates.ExpiresAt
	}
	if updates.IsActive != nil {
		secret.IsActive = *updates.IsActive
	}

	if err := s.db.Save(&secret).Error; err != nil {
		return nil, fmt.Errorf("failed to update secret: %w", err)
	}

	decryptedValue, err := s.decrypt(secret.Value)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt secret: %w", err)
	}
	secret.Value = decryptedValue

	if s.auditService != nil {
		s.auditService.LogAction(userID, "secret_updated", "secret", secret.ID.String(), true, "")
	}

	return &secret, nil
}

func (s *SecretService) DeleteSecret(id uuid.UUID, userID uuid.UUID) error {
	if err := s.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Secret{}).Error; err != nil {
		return fmt.Errorf("failed to delete secret: %w", err)
	}

	if s.auditService != nil {
		s.auditService.LogAction(userID, "secret_deleted", "secret", id.String(), true, "")
	}

	return nil
}

func (s *SecretService) encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.cryptoKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (s *SecretService) decrypt(ciphertext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(s.cryptoKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext_bytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext_bytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func (s *SecretService) hashValue(value string) string {
	hash := sha256.Sum256([]byte(value))
	return base64.StdEncoding.EncodeToString(hash[:])
}

var (
	ErrSecretNotFound = errors.New("secret not found")
	ErrSecretExpired  = errors.New("secret has expired")
)

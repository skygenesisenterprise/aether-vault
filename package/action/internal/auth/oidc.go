package auth

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

type OIDCClient struct {
	vaultURL string
	audience string
	logger   *logrus.Logger
}

func NewOIDCClient(vaultURL, audience string, logger *logrus.Logger) (*OIDCClient, error) {
	return &OIDCClient{
		vaultURL: vaultURL,
		audience: audience,
		logger:   logger,
	}, nil
}

func (c *OIDCClient) ExchangeJWTForToken(jwtToken string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Validate the JWT token
	claims, err := c.validateJWT(jwtToken)
	if err != nil {
		return "", fmt.Errorf("failed to validate JWT token: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"subject":  claims.Subject,
		"audience": claims.Audience,
		"issuer":   claims.Issuer,
	}).Info("JWT token validated successfully")

	return c.exchangeWithVault(ctx, jwtToken)
}

func (c *OIDCClient) validateJWT(jwtToken string) (*JWTClaims, error) {
	// Simple JWT parsing for GitHub Actions OIDC
	parts := strings.Split(jwtToken, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid JWT format")
	}

	// Decode payload (base64url)
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode JWT payload: %w", err)
	}

	var claims JWTClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("failed to parse JWT claims: %w", err)
	}

	// Basic validation
	if claims.Audience != c.audience {
		return nil, fmt.Errorf("invalid audience: expected %s, got %s", c.audience, claims.Audience)
	}

	if time.Now().Unix() > claims.Expiration {
		return nil, fmt.Errorf("token expired")
	}

	return &claims, nil
}

func (c *OIDCClient) exchangeWithVault(ctx context.Context, jwtToken string) (string, error) {
	client := &http.Client{Timeout: 30 * time.Second}

	data := url.Values{
		"role": {"github-action"},
		"jwt":  {jwtToken},
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/v1/auth/github/login", c.vaultURL),
		strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("failed to create vault request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call vault: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("vault authentication failed with status %d: %s",
			resp.StatusCode, string(body))
	}

	var result struct {
		Auth struct {
			ClientToken   string        `json:"client_token"`
			LeaseDuration time.Duration `json:"lease_duration"`
			Policies      []string      `json:"policies"`
		} `json:"auth"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode vault response: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"lease_duration": result.Auth.LeaseDuration,
		"policies":       result.Auth.Policies,
	}).Info("Vault token obtained successfully")

	return result.Auth.ClientToken, nil
}

type JWTClaims struct {
	Subject         string `json:"sub"`
	Audience        string `json:"aud"`
	Expiration      int64  `json:"exp"`
	IssuedAt        int64  `json:"iat"`
	Issuer          string `json:"iss"`
	Repository      string `json:"repository"`
	RepositoryOwner string `json:"repository_owner"`
	Ref             string `json:"ref"`
	Workflow        string `json:"workflow"`
	JobWorkflowRef  string `json:"job_workflow_ref"`
}

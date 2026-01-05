package vault

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/skygenesisenterprise/package/action/internal/auth"
	"github.com/skygenesisenterprise/package/action/internal/config"
)

type Client struct {
	config     *config.Config
	httpClient *http.Client
	logger     *logrus.Logger
}

type PolicyCheckResult struct {
	Status     string      `json:"status"`
	ReportID   string      `json:"report_id"`
	Violations []Violation `json:"violations,omitempty"`
}

type Violation struct {
	Rule     string `json:"rule"`
	Secret   string `json:"secret"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
}

func NewClient(cfg *config.Config, logger *logrus.Logger) *Client {
	return &Client{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}
}

func (c *Client) Authenticate() (string, error) {
	jwtToken := c.getGitHubJWTToken()
	if jwtToken == "" {
		return "", fmt.Errorf("failed to get GitHub JWT token")
	}

	authClient, err := auth.NewOIDCClient(c.config.VaultURL, c.config.Audience, c.logger)
	if err != nil {
		return "", fmt.Errorf("failed to create OIDC client: %w", err)
	}

	vaultToken, err := authClient.ExchangeJWTForToken(jwtToken)
	if err != nil {
		return "", fmt.Errorf("failed to exchange JWT for vault token: %w", err)
	}

	return vaultToken, nil
}

func (c *Client) ExecutePolicyCheck(token string) (string, string, error) {
	endpoint := fmt.Sprintf("%s/v1/policies/check", c.config.VaultURL)

	requestBody := map[string]interface{}{
		"role":       c.config.Role,
		"repository": c.getRepository(),
		"ref":        c.getRef(),
		"workflow":   c.getWorkflow(),
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal policy check request: %w", err)
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", "", fmt.Errorf("failed to create policy check request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("failed to execute policy check: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("policy check failed with status %d: %s",
			resp.StatusCode, string(body))
	}

	var result PolicyCheckResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", "", fmt.Errorf("failed to decode policy check response: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"status":    result.Status,
		"report_id": result.ReportID,
	}).Info("Policy check completed")

	return result.Status, result.ReportID, nil
}

func (c *Client) getGitHubJWTToken() string {
	if token := os.Getenv("ACTIONS_ID_TOKEN_REQUEST_URL"); token != "" {
		if token := os.Getenv("ACTIONS_ID_TOKEN_REQUEST_TOKEN"); token != "" {
			return c.fetchIDToken(token)
		}
	}
	return ""
}

func (c *Client) fetchIDToken(requestToken string) string {
	audience := c.config.Audience
	url := fmt.Sprintf("%s&audience=%s",
		os.Getenv("ACTIONS_ID_TOKEN_REQUEST_URL"), audience)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.logger.WithError(err).Error("Failed to create ID token request")
		return ""
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", requestToken))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.logger.WithError(err).Error("Failed to fetch ID token")
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.logger.Errorf("ID token request failed with status %d", resp.StatusCode)
		return ""
	}

	var result struct {
		Value string `json:"value"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.logger.WithError(err).Error("Failed to decode ID token response")
		return ""
	}

	return result.Value
}

func (c *Client) getRepository() string {
	return os.Getenv("GITHUB_REPOSITORY")
}

func (c *Client) getRef() string {
	return os.Getenv("GITHUB_REF")
}

func (c *Client) getWorkflow() string {
	return os.Getenv("GITHUB_WORKFLOW")
}

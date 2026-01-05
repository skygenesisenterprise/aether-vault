package github

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/sirupsen/logrus"
)

type Context struct {
	Repository      string
	RepositoryOwner string
	Ref             string
	Workflow        string
	JobWorkflowRef  string
	RunID           string
	Actor           string
	EventName       string
}

func GetContext(logger *logrus.Logger) (*Context, error) {
	ctx := &Context{
		Repository:      os.Getenv("GITHUB_REPOSITORY"),
		RepositoryOwner: os.Getenv("GITHUB_REPOSITORY_OWNER"),
		Ref:             os.Getenv("GITHUB_REF"),
		Workflow:        os.Getenv("GITHUB_WORKFLOW"),
		JobWorkflowRef:  os.Getenv("GITHUB_JOB_WORKFLOW_REF"),
		RunID:           os.Getenv("GITHUB_RUN_ID"),
		Actor:           os.Getenv("GITHUB_ACTOR"),
		EventName:       os.Getenv("GITHUB_EVENT_NAME"),
	}

	if ctx.Repository == "" {
		return nil, fmt.Errorf("GITHUB_REPOSITORY environment variable is required")
	}

	logger.WithFields(logrus.Fields{
		"repository":       ctx.Repository,
		"repository_owner": ctx.RepositoryOwner,
		"ref":              ctx.Ref,
		"workflow":         ctx.Workflow,
		"run_id":           ctx.RunID,
		"actor":            ctx.Actor,
		"event_name":       ctx.EventName,
	}).Info("GitHub context loaded")

	return ctx, nil
}

func (c *Context) GetJWTToken() (string, error) {
	requestURL := os.Getenv("ACTIONS_ID_TOKEN_REQUEST_URL")
	requestToken := os.Getenv("ACTIONS_ID_TOKEN_REQUEST_TOKEN")

	if requestURL == "" || requestToken == "" {
		return "", fmt.Errorf("GitHub OIDC tokens not available")
	}

	client := &http.Client{Timeout: 30 * time.Second}

	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", requestToken))

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("token request failed with status %d: %s",
			resp.StatusCode, string(body))
	}

	var result struct {
		Value string `json:"value"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode token response: %w", err)
	}

	return result.Value, nil
}

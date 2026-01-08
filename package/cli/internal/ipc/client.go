package ipc

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"time"

	"github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

// Client represents the IPC client
type Client struct {
	// Client configuration
	config *ClientConfig

	// Network connection
	conn net.Conn

	// Connection state
	connected bool

	// Client state
	state *ClientState

	// Request timeout
	requestTimeout time.Duration
}

// ClientConfig represents client configuration
type ClientConfig struct {
	// Socket path
	SocketPath string `json:"socketPath"`

	// Connection timeout
	ConnTimeout time.Duration `json:"connTimeout"`

	// Request timeout
	RequestTimeout time.Duration `json:"requestTimeout"`

	// Enable TLS
	EnableTLS bool `json:"enableTLS"`

	// TLS configuration
	TLSConfig *TLSConfig `json:"tlsConfig,omitempty"`

	// Enable authentication
	EnableAuth bool `json:"enableAuth"`

	// Authentication credentials
	AuthCredentials *AuthCredentials `json:"authCredentials,omitempty"`

	// Client identity
	Identity string `json:"identity"`

	// Enable logging
	EnableLogging bool `json:"enableLogging"`

	// Log level
	LogLevel string `json:"logLevel"`
}

// TLSConfig represents TLS configuration
type TLSConfig struct {
	// CA certificate file
	CAFile string `json:"caFile,omitempty"`

	// Client certificate file
	CertFile string `json:"certFile,omitempty"`

	// Client key file
	KeyFile string `json:"keyFile,omitempty"`

	// Server name
	ServerName string `json:"serverName,omitempty"`

	// Skip verification
	InsecureSkipVerify bool `json:"insecureSkipVerify"`
}

// AuthCredentials represents authentication credentials
type AuthCredentials struct {
	// Authentication method
	Method string `json:"method"`

	// Token
	Token string `json:"token,omitempty"`

	// Username
	Username string `json:"username,omitempty"`

	// Password
	Password string `json:"password,omitempty"`

	// Certificate
	Certificate string `json:"certificate,omitempty"`
}

// ClientState represents client state
type ClientState struct {
	// Authenticated status
	Authenticated bool

	// Authentication identity
	Identity string

	// Session ID
	SessionID string

	// Last activity
	LastActivity time.Time

	// Server information
	ServerInfo *ServerInfo
}

// ServerInfo represents server information
type ServerInfo struct {
	// Server version
	Version string `json:"version"`

	// Server capabilities
	Capabilities []string `json:"capabilities"`

	// Server uptime
	Uptime time.Duration `json:"uptime"`

	// Connection count
	ConnectionCount int `json:"connectionCount"`
}

// DefaultClientConfig returns default client configuration
func DefaultClientConfig() *ClientConfig {
	homeDir, _ := os.UserHomeDir()
	return &ClientConfig{
		SocketPath:     filepath.Join(homeDir, ".aether-vault", "agent.sock"),
		ConnTimeout:    30 * time.Second,
		RequestTimeout: 30 * time.Second,
		EnableTLS:      false,
		EnableAuth:     true,
		Identity:       "cli-client",
		EnableLogging:  true,
		LogLevel:       "info",
	}
}

// NewClient creates a new IPC client
func NewClient(config *ClientConfig) (*Client, error) {
	if config == nil {
		config = DefaultClientConfig()
	}

	client := &Client{
		config:         config,
		connected:      false,
		requestTimeout: config.RequestTimeout,
		state: &ClientState{
			Authenticated: false,
			LastActivity:  time.Now(),
		},
	}

	return client, nil
}

// Connect connects to the IPC server
func (c *Client) Connect() error {
	if c.connected {
		return fmt.Errorf("already connected")
	}

	// Create connection with timeout
	ctx, cancel := context.WithTimeout(context.Background(), c.config.ConnTimeout)
	defer cancel()

	var conn net.Conn
	var err error

	// Connect to Unix socket
	dialer := &net.Dialer{}
	conn, err = dialer.DialContext(ctx, "unix", c.config.SocketPath)
	if err != nil {
		return fmt.Errorf("failed to connect to socket: %w", err)
	}

	c.conn = conn
	c.connected = true

	// Authenticate if required
	if c.config.EnableAuth {
		if err := c.authenticate(); err != nil {
			c.Close()
			return fmt.Errorf("authentication failed: %w", err)
		}
	}

	// Get server info
	if err := c.getServerInfo(); err != nil {
		if c.config.EnableLogging {
			fmt.Printf("Warning: failed to get server info: %v\n", err)
		}
	}

	if c.config.EnableLogging {
		fmt.Println("Connected to Aether Vault Agent")
	}

	return nil
}

// Close closes the client connection
func (c *Client) Close() error {
	if !c.connected {
		return nil
	}

	if c.conn != nil {
		c.conn.Close()
	}

	c.connected = false
	c.state.Authenticated = false

	if c.config.EnableLogging {
		fmt.Println("Disconnected from Aether Vault Agent")
	}

	return nil
}

// RequestCapability requests a new capability
func (c *Client) RequestCapability(request *types.CapabilityRequest) (*types.CapabilityResponse, error) {
	if !c.connected {
		return nil, fmt.Errorf("not connected")
	}

	// Add client identity to request
	if request.Identity == "" {
		request.Identity = c.config.Identity
	}

	// Create protocol message
	protocol := &Protocol{
		Version:   "1.0",
		Type:      TypeCapabilityRequest,
		ID:        c.generateMessageID(),
		Timestamp: time.Now(),
		Payload:   request,
	}

	// Send request and get response
	response, err := c.sendRequest(protocol)
	if err != nil {
		return nil, err
	}

	// Parse response
	if response.Type == TypeErrorResponse {
		return nil, fmt.Errorf("server error: %v", response.Payload)
	}

	// Convert to CapabilityResponse
	responseData, _ := json.Marshal(response.Payload)
	var capabilityResponse types.CapabilityResponse
	if err := json.Unmarshal(responseData, &capabilityResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &capabilityResponse, nil
}

// ValidateCapability validates a capability
func (c *Client) ValidateCapability(capabilityID string, context *types.RequestContext) (*types.ValidationResult, error) {
	if !c.connected {
		return nil, fmt.Errorf("not connected")
	}

	// Create request payload
	payload := map[string]interface{}{
		"capability_id": capabilityID,
	}

	if context != nil {
		payload["context"] = context
	}

	// Create protocol message
	protocol := &Protocol{
		Version:   "1.0",
		Type:      TypeCapabilityValidate,
		ID:        c.generateMessageID(),
		Timestamp: time.Now(),
		Payload:   payload,
	}

	// Send request and get response
	response, err := c.sendRequest(protocol)
	if err != nil {
		return nil, err
	}

	// Parse response
	if response.Type == TypeErrorResponse {
		return nil, fmt.Errorf("server error: %v", response.Payload)
	}

	// Convert to ValidationResult
	responseData, _ := json.Marshal(response.Payload)
	var validationResult types.ValidationResult
	if err := json.Unmarshal(responseData, &validationResult); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &validationResult, nil
}

// RevokeCapability revokes a capability
func (c *Client) RevokeCapability(capabilityID, reason string) error {
	if !c.connected {
		return fmt.Errorf("not connected")
	}

	// Create request payload
	payload := map[string]interface{}{
		"capability_id": capabilityID,
		"reason":        reason,
	}

	if c.state.Identity != "" {
		payload["revoked_by"] = c.state.Identity
	}

	// Create protocol message
	protocol := &Protocol{
		Version:   "1.0",
		Type:      TypeCapabilityRevoke,
		ID:        c.generateMessageID(),
		Timestamp: time.Now(),
		Payload:   payload,
	}

	// Send request and get response
	response, err := c.sendRequest(protocol)
	if err != nil {
		return err
	}

	// Parse response
	if response.Type == TypeErrorResponse {
		return fmt.Errorf("server error: %v", response.Payload)
	}

	return nil
}

// ListCapabilities lists capabilities
func (c *Client) ListCapabilities(filter *types.CapabilityFilter) ([]*types.Capability, error) {
	if !c.connected {
		return nil, fmt.Errorf("not connected")
	}

	// Create request payload
	payload := map[string]interface{}{}
	if filter != nil {
		payload["filter"] = filter
	}

	// Create protocol message
	protocol := &Protocol{
		Version:   "1.0",
		Type:      TypeCapabilityList,
		ID:        c.generateMessageID(),
		Timestamp: time.Now(),
		Payload:   payload,
	}

	// Send request and get response
	response, err := c.sendRequest(protocol)
	if err != nil {
		return nil, err
	}

	// Parse response
	if response.Type == TypeErrorResponse {
		return nil, fmt.Errorf("server error: %v", response.Payload)
	}

	// Extract capabilities
	responsePayload, ok := response.Payload.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid response format")
	}

	capabilitiesData, ok := responsePayload["capabilities"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("capabilities not found in response")
	}

	// Convert to Capability slice
	capabilities := make([]*types.Capability, 0)
	for _, capData := range capabilitiesData {
		capBytes, _ := json.Marshal(capData)
		var capability types.Capability
		if err := json.Unmarshal(capBytes, &capability); err == nil {
			capabilities = append(capabilities, &capability)
		}
	}

	return capabilities, nil
}

// GetStatus gets the server status
func (c *Client) GetStatus() (*ServerInfo, error) {
	if !c.connected {
		return nil, fmt.Errorf("not connected")
	}

	// Create protocol message
	protocol := &Protocol{
		Version:   "1.0",
		Type:      TypeStatusRequest,
		ID:        c.generateMessageID(),
		Timestamp: time.Now(),
	}

	// Send request and get response
	response, err := c.sendRequest(protocol)
	if err != nil {
		return nil, err
	}

	// Parse response
	if response.Type == TypeErrorResponse {
		return nil, fmt.Errorf("server error: %v", response.Payload)
	}

	// Convert to ServerInfo
	responseData, _ := json.Marshal(response.Payload)
	var serverInfo ServerInfo
	if err := json.Unmarshal(responseData, &serverInfo); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &serverInfo, nil
}

// Ping sends a ping to the server
func (c *Client) Ping() error {
	if !c.connected {
		return fmt.Errorf("not connected")
	}

	// Create protocol message
	protocol := &Protocol{
		Version:   "1.0",
		Type:      TypePingRequest,
		ID:        c.generateMessageID(),
		Timestamp: time.Now(),
		Payload:   map[string]interface{}{"message": "ping"},
	}

	// Send request and get response
	response, err := c.sendRequest(protocol)
	if err != nil {
		return err
	}

	// Parse response
	if response.Type != TypePingResponse {
		return fmt.Errorf("unexpected response type: %s", response.Type)
	}

	return nil
}

// IsConnected returns the connection status
func (c *Client) IsConnected() bool {
	return c.connected
}

// IsAuthenticated returns the authentication status
func (c *Client) IsAuthenticated() bool {
	return c.state.Authenticated
}

// GetIdentity returns the client identity
func (c *Client) GetIdentity() string {
	return c.state.Identity
}

// sendRequest sends a request and waits for response
func (c *Client) sendRequest(protocol *Protocol) (*Protocol, error) {
	// Set timeout
	if c.conn != nil {
		c.conn.SetWriteDeadline(time.Now().Add(c.requestTimeout))
		c.conn.SetReadDeadline(time.Now().Add(c.requestTimeout))
	}

	// Send request
	encoder := json.NewEncoder(c.conn)
	if err := encoder.Encode(protocol); err != nil {
		c.connected = false
		return nil, fmt.Errorf("failed to send request: %w", err)
	}

	// Read response
	decoder := json.NewDecoder(c.conn)
	var response Protocol
	if err := decoder.Decode(&response); err != nil {
		c.connected = false
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Update last activity
	c.state.LastActivity = time.Now()

	return &response, nil
}

// authenticate performs authentication
func (c *Client) authenticate() error {
	// TODO: Implement authentication
	// For now, just set authenticated state
	c.state.Authenticated = true
	c.state.Identity = c.config.Identity

	return nil
}

// getServerInfo retrieves server information
func (c *Client) getServerInfo() error {
	serverInfo, err := c.GetStatus()
	if err != nil {
		return err
	}

	c.state.ServerInfo = serverInfo
	return nil
}

// generateMessageID generates a unique message ID
func (c *Client) generateMessageID() string {
	return fmt.Sprintf("msg_%d", time.Now().UnixNano())
}

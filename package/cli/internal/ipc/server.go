package ipc

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/capability"
	"github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

// Protocol represents the IPC protocol
type Protocol struct {
	// Protocol version
	Version string `json:"version"`

	// Message type
	Type string `json:"type"`

	// Message ID
	ID string `json:"id"`

	// Timestamp
	Timestamp time.Time `json:"timestamp"`

	// Payload
	Payload interface{} `json:"payload"`

	// Signature
	Signature []byte `json:"signature,omitempty"`
}

// Message types
const (
	// Request types
	TypeCapabilityRequest  = "capability_request"
	TypeCapabilityValidate = "capability_validate"
	TypeCapabilityRevoke   = "capability_revoke"
	TypeCapabilityList     = "capability_list"
	TypeStatusRequest      = "status_request"
	TypePingRequest        = "ping_request"

	// Response types
	TypeCapabilityResponse = "capability_response"
	TypeValidationResponse = "validation_response"
	TypeStatusResponse     = "status_response"
	TypePingResponse       = "ping_response"
	TypeErrorResponse      = "error_response"
)

// Server represents the IPC server
type Server struct {
	// Server configuration
	config *ServerConfig

	// Capability engine
	engine *capability.Engine

	// Policy engine
	policyEngine *capability.PolicyEngine

	// Unix socket listener
	listener net.Listener

	// Active connections
	connections map[string]*Connection

	// Connection mutex
	connMutex sync.RWMutex

	// Server state
	running bool

	// Shutdown channel
	shutdown chan struct{}

	// Wait group for graceful shutdown
	wg sync.WaitGroup
}

// ServerConfig represents server configuration
type ServerConfig struct {
	// Socket path
	SocketPath string `json:"socketPath"`

	// Enable authentication
	EnableAuth bool `json:"enableAuth"`

	// Authentication timeout
	AuthTimeout time.Duration `json:"authTimeout"`

	// Connection timeout
	ConnTimeout time.Duration `json:"connTimeout"`

	// Maximum connections
	MaxConnections int `json:"maxConnections"`

	// Enable TLS
	EnableTLS bool `json:"enableTLS"`

	// TLS certificate file
	TLSCertFile string `json:"tlsCertFile,omitempty"`

	// TLS key file
	TLSKeyFile string `json:"tlsKeyFile,omitempty"`

	// Request timeout
	RequestTimeout time.Duration `json:"requestTimeout"`

	// Enable logging
	EnableLogging bool `json:"enableLogging"`

	// Log level
	LogLevel string `json:"logLevel"`
}

// Connection represents an active connection
type Connection struct {
	// Connection ID
	ID string

	// Network connection
	Conn net.Conn

	// Remote address
	RemoteAddr string

	// Authenticated status
	Authenticated bool

	// Authentication identity
	Identity string

	// Connection metadata
	Metadata map[string]interface{}

	// Last activity
	LastActivity time.Time

	// Connection mutex
	Mutex sync.RWMutex
}

// DefaultServerConfig returns default server configuration
func DefaultServerConfig() *ServerConfig {
	homeDir, _ := os.UserHomeDir()
	return &ServerConfig{
		SocketPath:     filepath.Join(homeDir, ".aether-vault", "agent.sock"),
		EnableAuth:     true,
		AuthTimeout:    30 * time.Second,
		ConnTimeout:    60 * time.Second,
		MaxConnections: 100,
		EnableTLS:      false,
		RequestTimeout: 30 * time.Second,
		EnableLogging:  true,
		LogLevel:       "info",
	}
}

// NewServer creates a new IPC server
func NewServer(config *ServerConfig, engine *capability.Engine, policyEngine *capability.PolicyEngine) (*Server, error) {
	if config == nil {
		config = DefaultServerConfig()
	}

	server := &Server{
		config:       config,
		engine:       engine,
		policyEngine: policyEngine,
		connections:  make(map[string]*Connection),
		shutdown:     make(chan struct{}),
	}

	return server, nil
}

// Start starts the IPC server
func (s *Server) Start() error {
	// Create socket directory if it doesn't exist
	socketDir := filepath.Dir(s.config.SocketPath)
	if err := os.MkdirAll(socketDir, 0755); err != nil {
		return fmt.Errorf("failed to create socket directory: %w", err)
	}

	// Remove existing socket file
	if _, err := os.Stat(s.config.SocketPath); err == nil {
		if err := os.Remove(s.config.SocketPath); err != nil {
			return fmt.Errorf("failed to remove existing socket: %w", err)
		}
	}

	// Create Unix socket listener
	listener, err := net.Listen("unix", s.config.SocketPath)
	if err != nil {
		return fmt.Errorf("failed to create socket listener: %w", err)
	}

	// Set socket permissions
	if err := os.Chmod(s.config.SocketPath, 0755); err != nil {
		listener.Close()
		return fmt.Errorf("failed to set socket permissions: %w", err)
	}

	s.listener = listener
	s.running = true

	// Start connection handler
	s.wg.Add(1)
	go s.connectionHandler()

	if s.config.EnableLogging {
		fmt.Printf("IPC server started on %s\n", s.config.SocketPath)
	}

	return nil
}

// Stop stops the IPC server
func (s *Server) Stop() error {
	if !s.running {
		return nil
	}

	s.running = false

	// Close shutdown channel
	close(s.shutdown)

	// Close listener
	if s.listener != nil {
		s.listener.Close()
	}

	// Close all connections
	s.connMutex.Lock()
	for _, conn := range s.connections {
		conn.Conn.Close()
	}
	s.connMutex.Unlock()

	// Wait for all goroutines to finish
	s.wg.Wait()

	// Remove socket file
	if _, err := os.Stat(s.config.SocketPath); err == nil {
		os.Remove(s.config.SocketPath)
	}

	if s.config.EnableLogging {
		fmt.Println("IPC server stopped")
	}

	return nil
}

// connectionHandler handles incoming connections
func (s *Server) connectionHandler() {
	defer s.wg.Done()

	for {
		select {
		case <-s.shutdown:
			return
		default:
			// Set accept timeout
			if tcpListener, ok := s.listener.(*net.UnixListener); ok {
				tcpListener.SetDeadline(time.Now().Add(1 * time.Second))
			}

			// Accept new connection
			conn, err := s.listener.Accept()
			if err != nil {
				if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
					continue // Timeout, continue
				}
				if s.config.EnableLogging {
					fmt.Printf("Accept error: %v\n", err)
				}
				continue
			}

			// Check connection limit
			s.connMutex.RLock()
			if len(s.connections) >= s.config.MaxConnections {
				s.connMutex.RUnlock()
				conn.Close()
				if s.config.EnableLogging {
					fmt.Println("Connection limit reached, rejecting connection")
				}
				continue
			}
			s.connMutex.RUnlock()

			// Create connection object
			connection := &Connection{
				ID:            s.generateConnectionID(),
				Conn:          conn,
				RemoteAddr:    conn.RemoteAddr().String(),
				Authenticated: false,
				Metadata:      make(map[string]interface{}),
				LastActivity:  time.Now(),
			}

			// Add to connections
			s.connMutex.Lock()
			s.connections[connection.ID] = connection
			s.connMutex.Unlock()

			// Start connection handler
			s.wg.Add(1)
			go s.handleConnection(connection)
		}
	}
}

// handleConnection handles a single connection
func (s *Server) handleConnection(conn *Connection) {
	defer s.wg.Done()
	defer func() {
		conn.Conn.Close()
		s.connMutex.Lock()
		delete(s.connections, conn.ID)
		s.connMutex.Unlock()
	}()

	decoder := json.NewDecoder(conn.Conn)
	encoder := json.NewEncoder(conn.Conn)

	for {
		select {
		case <-s.shutdown:
			return
		default:
			// Set read timeout
			conn.Conn.SetReadDeadline(time.Now().Add(s.config.ConnTimeout))

			// Read message
			var protocol Protocol
			if err := decoder.Decode(&protocol); err != nil {
				if err == io.EOF {
					return // Connection closed
				}
				if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
					return // Timeout
				}
				if s.config.EnableLogging {
					fmt.Printf("Decode error: %v\n", err)
				}
				continue
			}

			// Update last activity
			conn.Mutex.Lock()
			conn.LastActivity = time.Now()
			conn.Mutex.Unlock()

			// Handle message
			response := s.handleMessage(conn, &protocol)

			// Send response
			if err := encoder.Encode(response); err != nil {
				if s.config.EnableLogging {
					fmt.Printf("Encode error: %v\n", err)
				}
				continue
			}
		}
	}
}

// handleMessage handles incoming messages
func (s *Server) handleMessage(conn *Connection, protocol *Protocol) *Protocol {
	response := &Protocol{
		Version:   "1.0",
		Type:      TypeErrorResponse,
		ID:        protocol.ID,
		Timestamp: time.Now(),
	}

	switch protocol.Type {
	case TypeCapabilityRequest:
		response = s.handleCapabilityRequest(conn, protocol)
	case TypeCapabilityValidate:
		response = s.handleCapabilityValidate(conn, protocol)
	case TypeCapabilityRevoke:
		response = s.handleCapabilityRevoke(conn, protocol)
	case TypeCapabilityList:
		response = s.handleCapabilityList(conn, protocol)
	case TypeStatusRequest:
		response = s.handleStatusRequest(conn, protocol)
	case TypePingRequest:
		response = s.handlePingRequest(conn, protocol)
	default:
		response.Payload = map[string]interface{}{
			"error": "unknown message type",
			"type":  protocol.Type,
		}
	}

	return response
}

// handleCapabilityRequest handles capability requests
func (s *Server) handleCapabilityRequest(conn *Connection, protocol *Protocol) *Protocol {
	response := &Protocol{
		Version:   "1.0",
		Type:      TypeCapabilityResponse,
		ID:        protocol.ID,
		Timestamp: time.Now(),
	}

	// Parse request payload
	payload, ok := protocol.Payload.(map[string]interface{})
	if !ok {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": "invalid payload format",
		}
		return response
	}

	// Convert to CapabilityRequest
	requestData, _ := json.Marshal(payload)
	var request types.CapabilityRequest
	if err := json.Unmarshal(requestData, &request); err != nil {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": fmt.Sprintf("invalid request format: %v", err),
		}
		return response
	}

	// Add connection identity to request
	if conn.Authenticated {
		request.Identity = conn.Identity
	}

	// Evaluate policy first
	if s.policyEngine != nil {
		policyResult, err := s.policyEngine.Evaluate(&request)
		if err != nil {
			response.Type = TypeErrorResponse
			response.Payload = map[string]interface{}{
				"error": fmt.Sprintf("policy evaluation failed: %v", err),
			}
			return response
		}

		// Check if policy allows the request
		if policyResult.Decision == "deny" {
			response.Type = TypeCapabilityResponse
			response.Payload = map[string]interface{}{
				"status":  "denied",
				"message": "Request denied by policy",
				"policy":  policyResult,
			}
			return response
		}
	}

	// Generate capability
	capabilityResponse, err := s.engine.GenerateCapability(&request)
	if err != nil {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": fmt.Sprintf("capability generation failed: %v", err),
		}
		return response
	}

	response.Payload = capabilityResponse
	return response
}

// handleCapabilityValidate handles capability validation
func (s *Server) handleCapabilityValidate(conn *Connection, protocol *Protocol) *Protocol {
	response := &Protocol{
		Version:   "1.0",
		Type:      TypeValidationResponse,
		ID:        protocol.ID,
		Timestamp: time.Now(),
	}

	// Parse request payload
	payload, ok := protocol.Payload.(map[string]interface{})
	if !ok {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": "invalid payload format",
		}
		return response
	}

	// Extract capability ID and context
	capabilityID, ok := payload["capability_id"].(string)
	if !ok {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": "capability_id is required",
		}
		return response
	}

	// Parse context
	var context *types.RequestContext
	if contextData, exists := payload["context"]; exists {
		contextDataBytes, _ := json.Marshal(contextData)
		context = &types.RequestContext{}
		json.Unmarshal(contextDataBytes, context)
	}

	// Add connection context
	if context == nil {
		context = &types.RequestContext{}
	}
	if conn.Authenticated {
		context.SourceIP = conn.RemoteAddr
	}

	// Validate capability
	validationResult, err := s.engine.ValidateCapability(capabilityID, context)
	if err != nil {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": fmt.Sprintf("validation failed: %v", err),
		}
		return response
	}

	response.Payload = validationResult
	return response
}

// handleCapabilityRevoke handles capability revocation
func (s *Server) handleCapabilityRevoke(conn *Connection, protocol *Protocol) *Protocol {
	response := &Protocol{
		Version:   "1.0",
		Type:      TypeCapabilityResponse,
		ID:        protocol.ID,
		Timestamp: time.Now(),
	}

	// Parse request payload
	payload, ok := protocol.Payload.(map[string]interface{})
	if !ok {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": "invalid payload format",
		}
		return response
	}

	// Extract capability ID
	capabilityID, ok := payload["capability_id"].(string)
	if !ok {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": "capability_id is required",
		}
		return response
	}

	// Extract reason and revoked by
	reason, _ := payload["reason"].(string)
	revokedBy := conn.Identity
	if rb, ok := payload["revoked_by"].(string); ok {
		revokedBy = rb
	}

	// Revoke capability
	if err := s.engine.RevokeCapability(capabilityID, reason, revokedBy); err != nil {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": fmt.Sprintf("revocation failed: %v", err),
		}
		return response
	}

	response.Payload = map[string]interface{}{
		"status":  "revoked",
		"message": "Capability revoked successfully",
	}

	return response
}

// handleCapabilityList handles capability listing
func (s *Server) handleCapabilityList(conn *Connection, protocol *Protocol) *Protocol {
	response := &Protocol{
		Version:   "1.0",
		Type:      TypeCapabilityResponse,
		ID:        protocol.ID,
		Timestamp: time.Now(),
	}

	// Parse request payload
	payload, ok := protocol.Payload.(map[string]interface{})
	if !ok {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": "invalid payload format",
		}
		return response
	}

	// Create filter
	filter := &types.CapabilityFilter{}
	if conn.Authenticated {
		filter.Identity = conn.Identity
	}

	// Parse filter from payload
	if filterData, exists := payload["filter"]; exists {
		filterDataBytes, _ := json.Marshal(filterData)
		json.Unmarshal(filterDataBytes, filter)
	}

	// List capabilities
	capabilities, err := s.engine.ListCapabilities(filter)
	if err != nil {
		response.Type = TypeErrorResponse
		response.Payload = map[string]interface{}{
			"error": fmt.Sprintf("listing failed: %v", err),
		}
		return response
	}

	response.Payload = map[string]interface{}{
		"capabilities": capabilities,
		"count":        len(capabilities),
	}

	return response
}

// handleStatusRequest handles status requests
func (s *Server) handleStatusRequest(conn *Connection, protocol *Protocol) *Protocol {
	response := &Protocol{
		Version:   "1.0",
		Type:      TypeStatusResponse,
		ID:        protocol.ID,
		Timestamp: time.Now(),
	}

	// Get server status
	s.connMutex.RLock()
	connectionCount := len(s.connections)
	s.connMutex.RUnlock()

	status := map[string]interface{}{
		"running":         s.running,
		"connections":     connectionCount,
		"max_connections": s.config.MaxConnections,
		"socket_path":     s.config.SocketPath,
		"uptime":          time.Since(time.Now()).String(), // TODO: Track actual start time
		"authenticated":   conn.Authenticated,
		"connection_id":   conn.ID,
	}

	response.Payload = status
	return response
}

// handlePingRequest handles ping requests
func (s *Server) handlePingRequest(conn *Connection, protocol *Protocol) *Protocol {
	response := &Protocol{
		Version:   "1.0",
		Type:      TypePingResponse,
		ID:        protocol.ID,
		Timestamp: time.Now(),
		Payload: map[string]interface{}{
			"message": "pong",
			"server":  "aether-vault-agent",
		},
	}

	return response
}

// generateConnectionID generates a unique connection ID
func (s *Server) generateConnectionID() string {
	return fmt.Sprintf("conn_%d", time.Now().UnixNano())
}

// GetConnectionCount returns the current connection count
func (s *Server) GetConnectionCount() int {
	s.connMutex.RLock()
	defer s.connMutex.RUnlock()
	return len(s.connections)
}

// IsRunning returns the server running status
func (s *Server) IsRunning() bool {
	return s.running
}

package capability

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

// Policy represents an access control policy
type Policy struct {
	// Policy identifier
	ID string `json:"id"`

	// Policy name
	Name string `json:"name"`

	// Policy description
	Description string `json:"description,omitempty"`

	// Policy version
	Version string `json:"version"`

	// Policy status (active, inactive, deprecated)
	Status string `json:"status"`

	// Policy rules
	Rules []PolicyRule `json:"rules"`

	// Policy metadata
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// Creation timestamp
	CreatedAt time.Time `json:"created_at"`

	// Last modification timestamp
	UpdatedAt time.Time `json:"updated_at"`

	// Created by
	CreatedBy string `json:"created_by"`

	// Last modified by
	UpdatedBy string `json:"updated_by"`
}

// PolicyRule represents a single policy rule
type PolicyRule struct {
	// Rule identifier
	ID string `json:"id"`

	// Rule name
	Name string `json:"name,omitempty"`

	// Rule description
	Description string `json:"description,omitempty"`

	// Rule effect (allow, deny)
	Effect string `json:"effect"`

	// Resource patterns
	Resources []string `json:"resources"`

	// Action patterns
	Actions []string `json:"actions"`

	// Identity patterns
	Identities []string `json:"identities"`

	// Conditions
	Conditions []RuleCondition `json:"conditions,omitempty"`

	// Priority (higher number = higher priority)
	Priority int `json:"priority"`

	// Rule metadata
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// RuleCondition represents a rule condition
type RuleCondition struct {
	// Condition type (ip, time, environment, etc.)
	Type string `json:"type"`

	// Condition operator (eq, ne, in, not_in, regex, etc.)
	Operator string `json:"operator"`

	// Condition key
	Key string `json:"key,omitempty"`

	// Condition value(s)
	Value interface{} `json:"value,omitempty"`

	// Negate condition
	Negate bool `json:"negate,omitempty"`
}

// PolicyEngine represents the policy evaluation engine
type PolicyEngine struct {
	// Loaded policies
	policies map[string]*Policy

	// Policy cache
	cache *PolicyCache

	// Engine configuration
	config *PolicyEngineConfig

	// Policy directory
	policyDir string
}

// PolicyEngineConfig represents policy engine configuration
type PolicyEngineConfig struct {
	// Enable policy caching
	EnableCache bool `json:"enableCache"`

	// Cache TTL in seconds
	CacheTTL int64 `json:"cacheTTL"`

	// Cache size limit
	CacheSize int `json:"cacheSize"`

	// Enable policy reloading
	EnableReloading bool `json:"enableReloading"`

	// Reload interval in seconds
	ReloadInterval int64 `json:"reloadInterval"`

	// Default policy decision
	DefaultDecision string `json:"defaultDecision"`

	// Enable policy validation
	EnableValidation bool `json:"enableValidation"`
}

// PolicyCache represents a policy evaluation cache
type PolicyCache struct {
	entries map[string]*CacheEntry
	maxSize int
	ttl     time.Duration
}

// CacheEntry represents a cache entry
type CacheEntry struct {
	result    *PolicyResult
	timestamp time.Time
}

// PolicyResult represents policy evaluation result
type PolicyResult struct {
	// Decision (allow, deny)
	Decision string `json:"decision"`

	// Applied policies
	AppliedPolicies []string `json:"appliedPolicies,omitempty"`

	// Applied rules
	AppliedRules []string `json:"appliedRules,omitempty"`

	// Conditions
	Conditions []string `json:"conditions,omitempty"`

	// Reasoning
	Reasoning string `json:"reasoning,omitempty"`

	// Evaluation time
	EvaluationTime time.Duration `json:"evaluationTime"`

	// Cache hit
	CacheHit bool `json:"cacheHit,omitempty"`

	// Additional context
	Context map[string]interface{} `json:"context,omitempty"`
}

// DefaultPolicyEngineConfig returns default policy engine configuration
func DefaultPolicyEngineConfig() *PolicyEngineConfig {
	return &PolicyEngineConfig{
		EnableCache:      true,
		CacheTTL:         300, // 5 minutes
		CacheSize:        1000,
		EnableReloading:  true,
		ReloadInterval:   60, // 1 minute
		DefaultDecision:  "deny",
		EnableValidation: true,
	}
}

// NewPolicyEngine creates a new policy engine
func NewPolicyEngine(config *PolicyEngineConfig, policyDir string) (*PolicyEngine, error) {
	if config == nil {
		config = DefaultPolicyEngineConfig()
	}

	engine := &PolicyEngine{
		policies:  make(map[string]*Policy),
		config:    config,
		policyDir: policyDir,
	}

	// Initialize cache if enabled
	if config.EnableCache {
		engine.cache = &PolicyCache{
			entries: make(map[string]*CacheEntry),
			maxSize: config.CacheSize,
			ttl:     time.Duration(config.CacheTTL) * time.Second,
		}
	}

	// Load policies
	if err := engine.loadPolicies(); err != nil {
		return nil, fmt.Errorf("failed to load policies: %w", err)
	}

	// Start policy reloading if enabled
	if config.EnableReloading {
		go engine.startPolicyReloading()
	}

	return engine, nil
}

// Evaluate evaluates a capability request against policies
func (e *PolicyEngine) Evaluate(request *types.CapabilityRequest) (*PolicyResult, error) {
	startTime := time.Now()

	// Create cache key
	cacheKey := e.createCacheKey(request)

	// Check cache
	if e.cache != nil {
		if entry := e.cache.get(cacheKey); entry != nil {
			result := entry.result
			result.CacheHit = true
			result.EvaluationTime = time.Since(startTime)
			return result, nil
		}
	}

	// Evaluate policies
	result := &PolicyResult{
		Decision:        e.config.DefaultDecision,
		AppliedPolicies: []string{},
		AppliedRules:    []string{},
		Conditions:      []string{},
		Context:         make(map[string]interface{}),
		CacheHit:        false,
	}

	// Sort policies by priority
	sortedPolicies := e.getSortedPolicies()

	// Evaluate each policy
	for _, policy := range sortedPolicies {
		if policy.Status != "active" {
			continue
		}

		policyResult := e.evaluatePolicy(policy, request)
		if policyResult != nil {
			// Policy matched
			result.AppliedPolicies = append(result.AppliedPolicies, policy.ID)
			result.AppliedRules = append(result.AppliedRules, policyResult.AppliedRules...)
			result.Conditions = append(result.Conditions, policyResult.Conditions...)

			// Update decision if rule has higher priority
			if policyResult.Decision != "" {
				result.Decision = policyResult.Decision
				result.Reasoning = policyResult.Reasoning
			}

			// Stop evaluation if deny decision
			if result.Decision == "deny" {
				break
			}
		}
	}

	result.EvaluationTime = time.Since(startTime)

	// Cache result
	if e.cache != nil {
		e.cache.set(cacheKey, result)
	}

	return result, nil
}

// AddPolicy adds a new policy
func (e *PolicyEngine) AddPolicy(policy *Policy) error {
	if e.config.EnableValidation {
		if err := e.validatePolicy(policy); err != nil {
			return fmt.Errorf("policy validation failed: %w", err)
		}
	}

	e.policies[policy.ID] = policy

	// Clear cache
	if e.cache != nil {
		e.cache.clear()
	}

	return nil
}

// RemovePolicy removes a policy
func (e *PolicyEngine) RemovePolicy(policyID string) error {
	delete(e.policies, policyID)

	// Clear cache
	if e.cache != nil {
		e.cache.clear()
	}

	return nil
}

// GetPolicy retrieves a policy by ID
func (e *PolicyEngine) GetPolicy(policyID string) (*Policy, error) {
	policy, exists := e.policies[policyID]
	if !exists {
		return nil, fmt.Errorf("policy not found: %s", policyID)
	}

	return policy, nil
}

// ListPolicies returns all policies
func (e *PolicyEngine) ListPolicies() []*Policy {
	policies := make([]*Policy, 0, len(e.policies))
	for _, policy := range e.policies {
		policies = append(policies, policy)
	}

	return policies
}

// ReloadPolicies reloads policies from disk
func (e *PolicyEngine) ReloadPolicies() error {
	return e.loadPolicies()
}

// loadPolicies loads policies from the policy directory
func (e *PolicyEngine) loadPolicies() error {
	if e.policyDir == "" {
		return fmt.Errorf("policy directory not specified")
	}

	// Clear existing policies
	e.policies = make(map[string]*Policy)

	// Walk policy directory
	return filepath.Walk(e.policyDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Only process .json files
		if !strings.HasSuffix(path, ".json") || info.IsDir() {
			return nil
		}

		// Load policy file
		policy, err := e.loadPolicyFile(path)
		if err != nil {
			return fmt.Errorf("failed to load policy file %s: %w", path, err)
		}

		// Add policy
		e.policies[policy.ID] = policy

		return nil
	})
}

// loadPolicyFile loads a single policy file
func (e *PolicyEngine) loadPolicyFile(path string) (*Policy, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read policy file: %w", err)
	}

	var policy Policy
	if err := json.Unmarshal(data, &policy); err != nil {
		return nil, fmt.Errorf("failed to unmarshal policy: %w", err)
	}

	return &policy, nil
}

// evaluatePolicy evaluates a single policy against a request
func (e *PolicyEngine) evaluatePolicy(policy *Policy, request *types.CapabilityRequest) *PolicyResult {
	result := &PolicyResult{
		Decision:     "",
		AppliedRules: []string{},
		Conditions:   []string{},
		Context:      make(map[string]interface{}),
	}

	// Sort rules by priority (highest first)
	sortedRules := make([]PolicyRule, len(policy.Rules))
	copy(sortedRules, policy.Rules)

	// Simple bubble sort by priority (descending)
	for i := 0; i < len(sortedRules)-1; i++ {
		for j := 0; j < len(sortedRules)-i-1; j++ {
			if sortedRules[j].Priority < sortedRules[j+1].Priority {
				sortedRules[j], sortedRules[j+1] = sortedRules[j+1], sortedRules[j]
			}
		}
	}

	// Evaluate each rule
	for _, rule := range sortedRules {
		if e.evaluateRule(&rule, request) {
			// Rule matched
			result.AppliedRules = append(result.AppliedRules, rule.ID)
			result.Decision = rule.Effect
			result.Reasoning = fmt.Sprintf("Rule %s matched: %s", rule.ID, rule.Description)

			// Evaluate conditions
			for _, condition := range rule.Conditions {
				if e.evaluateCondition(&condition, request) {
					result.Conditions = append(result.Conditions, fmt.Sprintf("%s %s %v", condition.Key, condition.Operator, condition.Value))
				}
			}

			// Return first matching rule
			return result
		}
	}

	// No rules matched
	return nil
}

// evaluateRule evaluates a single rule against a request
func (e *PolicyEngine) evaluateRule(rule *PolicyRule, request *types.CapabilityRequest) bool {
	// Check resource patterns
	if len(rule.Resources) > 0 {
		matched := false
		for _, pattern := range rule.Resources {
			if e.matchPattern(pattern, request.Resource) {
				matched = true
				break
			}
		}
		if !matched {
			return false
		}
	}

	// Check action patterns
	if len(rule.Actions) > 0 {
		matched := false
		for _, pattern := range rule.Actions {
			for _, action := range request.Actions {
				if e.matchPattern(pattern, action) {
					matched = true
					break
				}
			}
			if matched {
				break
			}
		}
		if !matched {
			return false
		}
	}

	// Check identity patterns
	if len(rule.Identities) > 0 {
		matched := false
		for _, pattern := range rule.Identities {
			if e.matchPattern(pattern, request.Identity) {
				matched = true
				break
			}
		}
		if !matched {
			return false
		}
	}

	// Check conditions
	for _, condition := range rule.Conditions {
		if !e.evaluateCondition(&condition, request) {
			return false
		}
	}

	return true
}

// evaluateCondition evaluates a rule condition
func (e *PolicyEngine) evaluateCondition(condition *RuleCondition, request *types.CapabilityRequest) bool {
	var actualValue interface{}

	// Get actual value based on condition type
	switch condition.Type {
	case "ip":
		if request.Context != nil {
			actualValue = request.Context.SourceIP
		}
	case "time":
		actualValue = time.Now().Unix()
	case "environment":
		if request.Context != nil && request.Context.Runtime != nil {
			actualValue = e.getRuntimeValue(condition.Key, request.Context.Runtime)
		}
	case "identity":
		actualValue = request.Identity
	case "resource":
		actualValue = request.Resource
	case "action":
		actualValue = request.Actions
	default:
		return true // Unknown condition type, skip
	}

	// Evaluate condition
	matched := e.evaluateConditionValue(condition.Operator, actualValue, condition.Value)

	// Apply negation
	if condition.Negate {
		matched = !matched
	}

	return matched
}

// evaluateConditionValue evaluates a condition value
func (e *PolicyEngine) evaluateConditionValue(operator string, actual, expected interface{}) bool {
	switch operator {
	case "eq":
		return actual == expected
	case "ne":
		return actual != expected
	case "in":
		if expectedList, ok := expected.([]interface{}); ok {
			for _, item := range expectedList {
				if actual == item {
					return true
				}
			}
		}
		return false
	case "not_in":
		if expectedList, ok := expected.([]interface{}); ok {
			for _, item := range expectedList {
				if actual == item {
					return false
				}
			}
		}
		return true
	case "regex":
		// TODO: Implement regex matching
		return false
	case "gt":
		if actualNum, ok := actual.(float64); ok {
			if expectedNum, ok := expected.(float64); ok {
				return actualNum > expectedNum
			}
		}
		return false
	case "lt":
		if actualNum, ok := actual.(float64); ok {
			if expectedNum, ok := expected.(float64); ok {
				return actualNum < expectedNum
			}
		}
		return false
	case "contains":
		if actualStr, ok := actual.(string); ok {
			if expectedStr, ok := expected.(string); ok {
				return strings.Contains(actualStr, expectedStr)
			}
		}
		return false
	default:
		return false
	}
}

// matchPattern checks if a value matches a pattern
func (e *PolicyEngine) matchPattern(pattern, value string) bool {
	// Simple wildcard matching
	if strings.Contains(pattern, "*") {
		// Convert wildcard to regex
		regex := strings.ReplaceAll(pattern, "*", ".*")
		regex = "^" + regex + "$"
		// TODO: Implement regex matching
		return strings.HasPrefix(value, strings.TrimSuffix(pattern, "*"))
	}

	return pattern == value
}

// getRuntimeValue extracts runtime value
func (e *PolicyEngine) getRuntimeValue(key string, runtime *types.RuntimeContext) string {
	switch key {
	case "type":
		return runtime.Type
	case "id":
		return runtime.ID
	case "version":
		return runtime.Version
	default:
		if runtime.Container != nil {
			switch key {
			case "container.id":
				return runtime.Container.ID
			case "container.name":
				return runtime.Container.Name
			case "container.image":
				return runtime.Container.Image
			case "container.namespace":
				return runtime.Container.Namespace
			}
		}
		if runtime.Host != nil {
			switch key {
			case "host.hostname":
				return runtime.Host.Hostname
			case "host.platform":
				return runtime.Host.Platform
			case "host.architecture":
				return runtime.Host.Architecture
			}
		}
	}
	return ""
}

// validatePolicy validates a policy
func (e *PolicyEngine) validatePolicy(policy *Policy) error {
	if policy.ID == "" {
		return fmt.Errorf("policy ID cannot be empty")
	}

	if policy.Name == "" {
		return fmt.Errorf("policy name cannot be empty")
	}

	if policy.Version == "" {
		return fmt.Errorf("policy version cannot be empty")
	}

	if len(policy.Rules) == 0 {
		return fmt.Errorf("policy must have at least one rule")
	}

	// Validate rules
	for i, rule := range policy.Rules {
		if err := e.validateRule(&rule); err != nil {
			return fmt.Errorf("rule %d validation failed: %w", i, err)
		}
	}

	return nil
}

// validateRule validates a policy rule
func (e *PolicyEngine) validateRule(rule *PolicyRule) error {
	if rule.ID == "" {
		return fmt.Errorf("rule ID cannot be empty")
	}

	if rule.Effect != "allow" && rule.Effect != "deny" {
		return fmt.Errorf("rule effect must be 'allow' or 'deny'")
	}

	if rule.Priority < 0 {
		return fmt.Errorf("rule priority cannot be negative")
	}

	// Validate conditions
	for i, condition := range rule.Conditions {
		if err := e.validateCondition(&condition); err != nil {
			return fmt.Errorf("condition %d validation failed: %w", i, err)
		}
	}

	return nil
}

// validateCondition validates a rule condition
func (e *PolicyEngine) validateCondition(condition *RuleCondition) error {
	if condition.Type == "" {
		return fmt.Errorf("condition type cannot be empty")
	}

	if condition.Operator == "" {
		return fmt.Errorf("condition operator cannot be empty")
	}

	validOperators := []string{"eq", "ne", "in", "not_in", "regex", "gt", "lt", "contains"}
	valid := false
	for _, op := range validOperators {
		if condition.Operator == op {
			valid = true
			break
		}
	}
	if !valid {
		return fmt.Errorf("invalid condition operator: %s", condition.Operator)
	}

	return nil
}

// getSortedPolicies returns policies sorted by priority
func (e *PolicyEngine) getSortedPolicies() []*Policy {
	policies := make([]*Policy, 0, len(e.policies))
	for _, policy := range e.policies {
		policies = append(policies, policy)
	}

	// Sort by priority (highest first)
	// Simple bubble sort
	for i := 0; i < len(policies)-1; i++ {
		for j := 0; j < len(policies)-i-1; j++ {
			// Use rule priority as policy priority (highest rule priority)
			priority1 := 0
			for _, rule := range policies[j].Rules {
				if rule.Priority > priority1 {
					priority1 = rule.Priority
				}
			}

			priority2 := 0
			for _, rule := range policies[j+1].Rules {
				if rule.Priority > priority2 {
					priority2 = rule.Priority
				}
			}

			if priority1 < priority2 {
				policies[j], policies[j+1] = policies[j+1], policies[j]
			}
		}
	}

	return policies
}

// createCacheKey creates a cache key for a request
func (e *PolicyEngine) createCacheKey(request *types.CapabilityRequest) string {
	key := fmt.Sprintf("%s:%s:%s:", request.Identity, request.Resource, strings.Join(request.Actions, ","))
	if request.Context != nil {
		key += fmt.Sprintf("%s:", request.Context.SourceIP)
	}
	return key
}

// startPolicyReloading starts the policy reloading routine
func (e *PolicyEngine) startPolicyReloading() {
	ticker := time.NewTicker(time.Duration(e.config.ReloadInterval) * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := e.ReloadPolicies(); err != nil {
			// Log error but continue
			fmt.Printf("Policy reload error: %v\n", err)
		}
	}
}

// Policy cache methods

func (c *PolicyCache) get(key string) *CacheEntry {
	entry, exists := c.entries[key]
	if !exists {
		return nil
	}

	// Check TTL
	if time.Since(entry.timestamp) > c.ttl {
		delete(c.entries, key)
		return nil
	}

	return entry
}

func (c *PolicyCache) set(key string, result *PolicyResult) {
	// Check size limit
	if len(c.entries) >= c.maxSize {
		// Remove oldest entry (simple FIFO)
		var oldestKey string
		var oldestTime time.Time
		for k, entry := range c.entries {
			if oldestKey == "" || entry.timestamp.Before(oldestTime) {
				oldestKey = k
				oldestTime = entry.timestamp
			}
		}
		if oldestKey != "" {
			delete(c.entries, oldestKey)
		}
	}

	c.entries[key] = &CacheEntry{
		result:    result,
		timestamp: time.Now(),
	}
}

func (c *PolicyCache) clear() {
	c.entries = make(map[string]*CacheEntry)
}

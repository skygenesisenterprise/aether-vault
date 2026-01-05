package middleware

import (
	"crypto/rand"
	"encoding/hex"
)

func generateRequestID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

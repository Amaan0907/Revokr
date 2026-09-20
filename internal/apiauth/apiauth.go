// Package apiauth guards the API's /api/* routes with a single shared secret.
package apiauth

import (
	"crypto/sha256"
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Header is the request header that carries the shared secret.
const Header = "X-Revokr-Key"

// protectedPrefix is the only part of the API that requires the key. /health has
// to stay open for the load balancer, and /webhooks/github and
// /github/install/callback authenticate themselves.
const protectedPrefix = "/api/"

// Require returns middleware that rejects requests under /api/ unless they carry
// the shared secret in the X-Revokr-Key header. An empty key disables the check
// entirely, so local development needs no configuration.
//
// Register it with Engine.Use before the routes: gin only applies middleware to
// routes registered after it.
func Require(key string) gin.HandlerFunc {
	if key == "" {
		return func(c *gin.Context) { c.Next() }
	}

	want := sha256.Sum256([]byte(key))

	return func(c *gin.Context) {
		if !strings.HasPrefix(c.Request.URL.Path, protectedPrefix) {
			c.Next()
			return
		}

		// Hashing both sides first gives ConstantTimeCompare equal-length inputs,
		// so a wrong key's length is not revealed by how quickly it is rejected.
		got := sha256.Sum256([]byte(c.GetHeader(Header)))
		if subtle.ConstantTimeCompare(got[:], want[:]) != 1 {
			// No hint whether the header was missing or wrong.
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		c.Next()
	}
}

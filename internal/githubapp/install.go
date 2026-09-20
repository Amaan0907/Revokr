// Package githubapp handles the GitHub App installation flow — the route
// GitHub redirects to after a user installs or updates the App on their
// repositories (the App's "Setup URL" in its GitHub settings).
package githubapp

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// RegisterInstallCallback wires GET /github/install/callback.
func RegisterInstallCallback(r *gin.Engine) {
	r.GET("/github/install/callback", handleInstallCallback)
}

func handleInstallCallback(c *gin.Context) {
	installationID, err := strconv.ParseInt(c.Query("installation_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing or invalid installation_id"})
		return
	}
	setupAction := c.Query("setup_action") // "install" | "update"

	log.Printf("githubapp: install callback received (installation_id=%d, setup_action=%s)",
		installationID, setupAction)

	// Nothing is stored here: this redirect carries no signed-in user to satisfy the
	// github_installations.user_id foreign key. The installation and its repositories are
	// recorded from the "installation" webhook event instead (see installations.go).

	c.JSON(http.StatusOK, gin.H{
		"status":          "ok",
		"installation_id": installationID,
		"setup_action":    setupAction,
	})
}

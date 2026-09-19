package incidents

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterRoutes registers the incident management endpoints on the Gin router.
func RegisterRoutes(r *gin.Engine, pool *pgxpool.Pool) {
	api := r.Group("/api/incidents")
	{
		api.GET("", handleListIncidents(pool))
		api.GET("/:id", handleGetIncident(pool))
		api.GET("/:id/audit", handleGetAuditLogs(pool))
		api.GET("/:id/analysis", handleGetAnalysis(pool))
		api.POST("/:id/transition", handleTransitionIncident(pool))
	}
}

func handleListIncidents(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if pool == nil {
			c.JSON(http.StatusOK, gin.H{"incidents": []Incident{}})
			return
		}

		limitStr := c.DefaultQuery("limit", "50")
		limit, _ := strconv.Atoi(limitStr)

		list, err := List(c.Request.Context(), pool, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if list == nil {
			list = []Incident{}
		}

		c.JSON(http.StatusOK, gin.H{"incidents": list})
	}
}

func handleGetIncident(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if pool == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "database not connected"})
			return
		}

		inc, err := GetByID(c.Request.Context(), pool, id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, inc)
	}
}

func handleGetAuditLogs(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if pool == nil {
			c.JSON(http.StatusOK, gin.H{"audit_logs": []AuditLog{}})
			return
		}

		logs, err := GetAuditLogs(c.Request.Context(), pool, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if logs == nil {
			logs = []AuditLog{}
		}

		c.JSON(http.StatusOK, gin.H{"audit_logs": logs})
	}
}

type transitionRequest struct {
	TargetStatus Status      `json:"target_status" binding:"required"`
	Actor        string      `json:"actor"`
	Action       AuditAction `json:"action"`
	Metadata     any         `json:"metadata"`
}

func handleTransitionIncident(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if pool == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not connected"})
			return
		}

		var req transitionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		actor := req.Actor
		if actor == "" {
			actor = "dashboard-user"
		}

		action := req.Action
		if action == "" {
			action = ActionApproved
		}

		// A transition to ROTATING is the one point in the lifecycle that
		// must actually reach a provider.Adapter (real or simulated) — every
		// other transition only ever changes a status row and writes an
		// audit log, which plain Transition already does.
		if req.TargetStatus == StatusValidating {
			inc, err := GetByID(c.Request.Context(), pool, id)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			if err := PerformValidation(c.Request.Context(), pool, inc, actor); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "ok", "new_status": StatusAwaitingApproval})
			return
		}

		if req.TargetStatus == StatusRotating {
			inc, err := GetByID(c.Request.Context(), pool, id)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			if err := PerformRotation(c.Request.Context(), pool, inc, actor, req.Metadata); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "ok", "new_status": StatusResolved})
			return
		}

		if err := Transition(c.Request.Context(), pool, id, req.TargetStatus, actor, action, req.Metadata); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok", "new_status": req.TargetStatus})
	}
}

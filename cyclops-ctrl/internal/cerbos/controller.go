package cerbos

import (
	"context"
	"net/http"
	"time"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/cerbos/db"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
)

var jwtKey = []byte("its_cyclops_secrets")

type Claims struct {
	jwt.StandardClaims
}

func Login(cerbosClient *CerbosSvc) gin.HandlerFunc {
	return func(c *gin.Context) {
		var credentials struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&credentials); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}

		userRecord, err := db.LookupUser(c.Request.Context(), credentials.Username)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user does not exist."})
			return
		}

		if credentials.Password != userRecord.Password {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid credentials"})
			return
		}

		authCtx, err := buildAuthContext(credentials.Username, c, cerbosClient)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		requestCtx := c.Request.Context()
		ctx := context.WithValue(requestCtx, authCtxKey, authCtx)
		c.Request = c.Request.WithContext(ctx)

		expirationTime := time.Now().Add(24 * time.Hour)
		claims := &Claims{
			StandardClaims: jwt.StandardClaims{
				Issuer:    "cyclops",
				Subject:   credentials.Username,
				ExpiresAt: expirationTime.Unix(),
				NotBefore: time.Now().Unix(),
				IssuedAt:  time.Now().Unix(),
				Id:        uuid.NewString(),
			},
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, err := token.SignedString(jwtKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
			return
		}

		c.SetCookie("cyclops.token", tokenString, int(time.Until(time.Now()).Seconds()), "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{"token": tokenString})
	}
}

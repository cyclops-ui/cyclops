package cerbos

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/cerbos/db"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
)

var jwtKey = []byte("its_cyclops_secrets")

type Claims struct {
	Username string   `json:"username"`
	Roles    []string `json:"roles"`
	jwt.StandardClaims
}

func Login(cerbosClient *CerbosSvc) gin.HandlerFunc {
	return func(c *gin.Context) {
		var credentials struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&credentials); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid credentials"})
			return
		}

		userRecord, err := db.LookupUser(c.Request.Context(), credentials.Username)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"error": "invalid credentials"})
			return
		}

		if credentials.Password != userRecord.Password {
			c.JSON(http.StatusOK, gin.H{"error": "invalid credentials"})
			return
		}

		authCtx, err := buildAuthContext(credentials.Username, c, cerbosClient)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		requestCtx := c.Request.Context()
		ctx := context.WithValue(requestCtx, authCtxKey, authCtx)
		c.Request = c.Request.WithContext(ctx)

		expirationTime := time.Now().Add(24 * time.Hour)
		claims := &Claims{
			Username: userRecord.Username,
			Roles:    userRecord.Roles,
			StandardClaims: jwt.StandardClaims{
				Issuer:    "cyclops",
				Subject:   userRecord.Username,
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

		c.SetCookie("cyclops.token", tokenString, int(time.Until(expirationTime).Seconds()), "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{"token": tokenString})
	}
}

func Logout() gin.HandlerFunc {
	return func(c *gin.Context) {
		expirationTime := time.Now().Add(-time.Hour)
		c.SetCookie("cyclops.token", "", int(expirationTime.Unix()), "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{"message": "Successfully logged out"})
	}
}

func GetRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No token"})
			return
		}

		// Check if the header starts with "Bearer "
		bearerToken := strings.Split(authHeader, " ")
		if len(bearerToken) != 2 || strings.ToLower(bearerToken[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		tokenString := bearerToken[1]

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// Validate the alg is what you expect
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return jwtKey, nil
		})

		if err != nil {
			if err == jwt.ErrSignatureInvalid {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
				return
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
			return
		}

		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		if len(claims.Roles) > 0 {
			c.JSON(http.StatusOK, gin.H{"roles": claims.Roles})
		} else {
			c.JSON(http.StatusOK, gin.H{"roles": []string{}})
		}
	}
}

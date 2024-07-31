package cerbos

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"

	cerbosSDK "github.com/cerbos/cerbos-sdk-go/cerbos"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/cerbos/db"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	ctrl "sigs.k8s.io/controller-runtime"
)

// authCtxKeyType to create a unique key for storing
// and retrieving the authentication context from the request context.
type authCtxKeyType struct{}

// authCtxKey is a unique value of type authCtxKeyType that is used as the key for
// the authentication context in the request context.
var authCtxKey = authCtxKeyType{}

type authContext struct {
	username  string
	principal *cerbosSDK.Principal
}

type CerbosSvc struct {
	cerbos *cerbosSDK.GRPCClient
}

var (
	authLog = ctrl.Log.WithName("action")
)

func New(cerbosAddr string) (*CerbosSvc, error) {
	cerbosInstance, err := cerbosSDK.New(cerbosAddr, cerbosSDK.WithPlaintext())
	if err != nil {
		return nil, err
	}
	return &CerbosSvc{cerbos: cerbosInstance}, nil
}

// isAllowed is a utility function to check each action against a Cerbos policy.
func (s *CerbosSvc) IsAllowed(ctx context.Context, resource *cerbosSDK.Resource, action string) (bool, error) {
	principalCtx := s.principalContext(ctx)
	if principalCtx == nil {
		return false, errors.New("principal context is nil")
	}
	allowed, err := principalCtx.IsAllowed(ctx, resource, action)
	if err != nil {
		return false, err
	}
	msg := fmt.Sprintf("%v actions is performed on %v.", action, resource)
	authLog.Info(msg)

	return allowed, nil
}

func getAuthContext(ctx context.Context) *authContext {
	ac := ctx.Value(authCtxKey)
	if ac == nil {
		return nil
	}
	return ac.(*authContext)
}

// principalContext retrieves the principal stored in the context by the authentication middleware.
func (s *CerbosSvc) principalContext(ctx context.Context) cerbosSDK.PrincipalContext {
	actx := getAuthContext(ctx)
	if actx == nil {
		log.Fatal("getAuthContext is nil")
	}
	msg := fmt.Sprintf("%v is performing actions...", actx.username)
	authLog.Info(msg)
	return s.cerbos.WithPrincipal(actx.principal)
}

// AuthMiddleware is a Gin middleware for authenticating requests and setting the auth context.
func AuthMiddleware(cerbosClient *CerbosSvc) gin.HandlerFunc {
	return func(c *gin.Context) {
		accessToken, err := c.Cookie("cyclops.token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized access"})
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(accessToken, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		authCtx, err := buildAuthContext(claims.Subject, c, cerbosClient)
		if err != nil {
			log.Printf("Failed to authenticate user [%s]: %v", claims.Subject, err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		requestCtx := c.Request.Context()
		ctx := context.WithValue(requestCtx, authCtxKey, authCtx)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// buildAuthContext verifies the username and creates an authContext.
func buildAuthContext(username string, c *gin.Context, _ *CerbosSvc) (*authContext, error) {
	userRecord, err := db.LookupUser(c.Request.Context(), username)
	if err != nil {
		return nil, err
	}

	newPrincipal := cerbosSDK.NewPrincipal(username).
		WithRoles(userRecord.Roles...).
		WithAttr("ipAddress", c.ClientIP())

	return &authContext{username: username, principal: newPrincipal}, nil
}

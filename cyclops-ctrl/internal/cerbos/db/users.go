package db

import (
	"context"
	"errors"
	"fmt"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"
)

type UserRecord struct {
	Username string
	Password string
	Roles    []string
}

type UsersData struct {
	Users []UserRecord `yaml:"users"`
}

type UserConfig struct {
	clientset *kubernetes.Clientset
}

// NewUserConfig creates a new UserConfig with a Kubernetes clientset.
func NewUserConfig() (*UserConfig, error) {
	config := ctrl.GetConfigOrDie()
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	return &UserConfig{clientset: clientset}, nil
}

// loadUserConfig fetches the user configuration from a Kubernetes secret based on a label selector.
func (u *UserConfig) loadUserConfig(namespace, userName string) (*UserRecord, error) {
	labelSelector := fmt.Sprintf("app.kubernetes.io/part-of=cyclops,app.kubernetes.io/type=user,app.kubernetes.io/name=%v", userName)
	secrets, err := u.clientset.CoreV1().Secrets(namespace).List(context.TODO(), metav1.ListOptions{
		LabelSelector: labelSelector,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list secrets: %w", err)
	}

	if len(secrets.Items) == 0 {
		return nil, errors.New("no secrets found matching the label selector")
	}

	// Assuming the first secret is the one we need.
	secret := secrets.Items[0]

	userRecord, err := mapSecretData(secret.Data)
	if err != nil {
		return nil, err
	}

	return userRecord, nil
}

// mapSecretData extracts the user record from the secret data.
func mapSecretData(secretData map[string][]byte) (*UserRecord, error) {
	username, ok := secretData["username"]
	if !ok {
		return nil, errors.New("username key not found in secret data")
	}
	password, ok := secretData["password"]
	if !ok {
		return nil, errors.New("password key not found in secret data")
	}
	roles, ok := secretData["roles"]
	if !ok {
		return nil, errors.New("roles key not found in secret data")
	}

	return &UserRecord{
		Username: string(username),
		Password: string(password),
		Roles:    strings.Split(string(roles), ","),
	}, nil
}

// LookupUser retrieves the record for the given username from cerbos-users-config secret.
func LookupUser(ctx context.Context, userName string) (*UserRecord, error) {
	userConf, err := NewUserConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to create user config: %w", err)
	}

	userRecord, err := userConf.loadUserConfig("cyclops", userName)
	if err != nil {
		return nil, fmt.Errorf("failed to load users: %v", err)
	}

	if userRecord.Username == userName {
		return userRecord, nil
	}

	return nil, errors.New("user not found")
}

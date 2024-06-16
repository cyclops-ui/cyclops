package db

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"

	"gopkg.in/yaml.v2"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"
)

type UserRecord struct {
	Username     string
	PasswordHash []byte
	Roles        []string
	Resources    []string
	Actions      []string
}

type UsersData struct {
	Users []UserRecord `yaml:"users"`
}

type UserConfig struct {
	clientset *kubernetes.Clientset
}

// LoadUsers loads users from the YAML file.
func loadUsers(filePath string) (*UsersData, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var usersData UsersData
	err = yaml.Unmarshal(data, &usersData)
	if err != nil {
		return nil, err
	}

	return &usersData, nil
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

// loadUserConfig fetches the user configuration from a Kubernetes secret.
func (u *UserConfig) loadUserConfig(namespace, secretName, key string) (*UsersData, error) {
	secret, err := u.clientset.CoreV1().Secrets(namespace).Get(context.TODO(), secretName, v1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch secret: %w", err)
	}

	userDataBytes := secret.Data[key]
	var usersData UsersData
	err = yaml.Unmarshal(userDataBytes, &usersData)
	if err != nil {
		return nil, err
	}

	return &usersData, nil
}

// LookupUser retrieves the record for the given username from cerbos-users-config secret.
func LookupUser(ctx context.Context, userName string) (*UserRecord, error) {
	userConf, err := NewUserConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to create user config: %w", err)
	}

	usersData, err := userConf.loadUserConfig("cyclops", "cerbos-users-config", "users.yaml")
	if err != nil {
		log.Fatalf("Failed to load users: %v", err)
	}

	for _, user := range usersData.Users {
		if user.Username == userName {
			return &user, nil
		}
	}

	return nil, errors.New("user not found")
}

package templates

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/go-redis/redis/v8"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
)

const (
	historyKey = "history"
	configKey  = "config:%s"
)

type Storage struct {
	client *redis.Client
}

func NewStorage() (*Storage, error) {
	client, err := newRedisClient()
	if err != nil {
		return nil, err
	}

	return &Storage{
		client: client,
	}, nil
}

// region config

func (s *Storage) StoreConfig(template models.Template) error {
	data, err := json.Marshal(template)
	if err != nil {
		return err
	}

	if err := s.client.HSet(context.TODO(), configurationKey(template.Name), "latest", data).Err(); err != nil {
		return err
	}

	return s.client.HSet(context.TODO(), configurationKey(template.Name), template.Version, data).Err()
}

func (s *Storage) GetConfigByVersion(name, version string) (models.Template, error) {
	if len(version) == 0 {
		version = "latest"
	}

	data, err := s.client.HGet(context.TODO(), configurationKey(name), version).Bytes()
	if err == redis.Nil {
		return models.Template{}, nil
	}
	if err != nil {
		return models.Template{}, err
	}

	var config models.Template
	if err := json.Unmarshal(data, &config); err != nil {
		return models.Template{}, err
	}

	return config, nil
}

//func (s *Storage) GetConfig(ref cyclopsv1alpha1.TemplateRef) (models.Template, error) {
//	if ref.URL != "" {
//		return git.LoadTemplate(ref.URL, ref.Path, ref.Version)
//	}
//
//	return s.GetConfigByVersion(ref.Path, ref.Version)
//}

func (s *Storage) ListConfigLatest() (out []models.Template, err error) {
	keys, err := s.client.Keys(context.TODO(), "config:*").Result()
	if err != nil {
		return nil, err
	}

	for _, key := range keys {
		configName := key[7:]

		config, err := s.GetConfigByVersion(configName, "latest")
		if err != nil {
			return nil, err
		}

		out = append(out, config)
	}

	return
}

func (s *Storage) GetConfigurationVersions(name string) ([]string, error) {
	return s.client.HKeys(context.TODO(), configurationKey(name)).Result()
}

func configurationKey(name string) string {
	return fmt.Sprintf(configKey, name)
}

// endregion

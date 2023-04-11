package storage

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/go-redis/redis/v8"
	"gitops/internal/workflow/cyclops/models"
)

const (
	historyKey = "history"
	configKey  = "config:%s"
)

type Storage struct {
	client *redis.Client
}

func New() (*Storage, error) {
	client, err := newRedisClient()
	if err != nil {
		return nil, err
	}

	return &Storage{
		client: client,
	}, nil
}

// region history

func (s *Storage) StoreHistoryEntry(namespace, name string, last models.HistoryEntry) error {
	data, err := s.client.HGet(context.TODO(), historyKey, name).Bytes()
	if err == redis.Nil {
		data = []byte("[]")
	} else if err != nil {
		return err
	}

	var historyEntries []models.HistoryEntry
	if err := json.Unmarshal(data, &historyEntries); err != nil {
		return err
	}

	historyEntries = append([]models.HistoryEntry{last}, historyEntries...)

	data, err = json.Marshal(historyEntries)
	if err != nil {
		return err
	}

	return s.client.HSet(context.TODO(), historyKey, name, data).Err()
}

func (s *Storage) GetDeploymentHistory(namespace, name string) ([]models.HistoryEntry, error) {
	data, err := s.client.HGet(context.TODO(), historyKey, name).Bytes()
	if err == redis.Nil {
		return []models.HistoryEntry{}, nil
	}
	if err != nil {
		return nil, err
	}

	var historyEntries []models.HistoryEntry
	if err := json.Unmarshal(data, &historyEntries); err != nil {
		return nil, err
	}

	return historyEntries, nil
}

func (s *Storage) DeleteDeploymentHistory(namespace, name string) error {
	return s.client.HDel(context.TODO(), historyKey, name).Err()
}

// endregion

// region config

func (s *Storage) StoreConfig(name string, config models.AppConfiguration) error {
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}

	if err := s.client.HSet(context.TODO(), configurationKey(name), "latest", data).Err(); err != nil {
		return err
	}

	return s.client.HSet(context.TODO(), configurationKey(name), config.Version, data).Err()
}

func (s *Storage) GetConfigByVersion(name, version string) (models.AppConfiguration, error) {
	if len(version) == 0 {
		version = "latest"
	}

	data, err := s.client.HGet(context.TODO(), configurationKey(name), version).Bytes()
	if err == redis.Nil {
		return models.AppConfiguration{}, nil
	}
	if err != nil {
		return models.AppConfiguration{}, err
	}

	var config models.AppConfiguration
	if err := json.Unmarshal(data, &config); err != nil {
		return models.AppConfiguration{}, err
	}

	return config, nil
}

func (s *Storage) GetConfig(name, version string) (models.AppConfiguration, error) {
	return s.GetConfigByVersion(name, version)
}

func (s *Storage) ListConfigLatest() (out []models.AppConfiguration, err error) {
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

package storage

import (
	"errors"
	"gitops/internal/workflow/cyclops/models"
	"sync"
)

type InMemStorage struct {
	storage sync.Map
}

func NewInMem() *InMemStorage {
	return &InMemStorage{storage: sync.Map{}}
}

func (s *InMemStorage) StoreHistoryEntry(namespace, name string, last models.HistoryEntry) error {
	data, ok := s.storage.Load(name)
	if !ok {
		s.storage.Store(name, []models.HistoryEntry{last})
		return nil
	}

	history, ok := data.([]models.HistoryEntry)
	if !ok {
		return errors.New("error casting to history entry slice")
	}

	history = append(history, last)
	s.storage.Store(name, history)

	return nil
}

func (s *InMemStorage) GetDeploymentHistory(namespace, name string) ([]models.HistoryEntry, error) {
	data, ok := s.storage.Load(name)
	if !ok {
		return []models.HistoryEntry{}, nil
	}

	history, ok := data.([]models.HistoryEntry)
	if !ok {
		return nil, errors.New("error casting to history entry slice")
	}

	return history, nil
}

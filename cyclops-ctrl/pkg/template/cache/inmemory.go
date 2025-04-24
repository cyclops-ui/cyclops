package cache

import (
	"fmt"
	"time"

	"github.com/dgraph-io/ristretto"
	json "github.com/json-iterator/go"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
)

type Templates struct {
	cache *ristretto.Cache
}

func NewInMemoryTemplatesCache() Templates {
	cache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 1e7,     // number of keys to track frequency of (10M).
		MaxCost:     1 << 30, // maximum cost of cache (1GB).
		BufferItems: 64,      // number of keys per Get buffer.
		Metrics:     true,
	})
	if err != nil {
		panic(err)
	}

	return Templates{
		cache: cache,
	}
}

func (t Templates) GetTemplate(repo, path, version, sourceType string) (*models.Template, bool) {
	value, found := t.cache.Get(templateKey(repo, path, version, sourceType))
	if !found {
		return nil, false
	}

	data, ok := value.([]byte)
	if !ok {
		return nil, false
	}

	var template *models.Template
	if err := json.Unmarshal(data, &template); err != nil {
		return nil, false
	}

	return template, ok
}

func (t Templates) SetTemplate(repo, path, version, sourceType string, template *models.Template) {
	data, err := json.Marshal(template)
	if err != nil {
		return
	}

	t.cache.SetWithTTL(templateKey(repo, path, version, sourceType), data, int64(len(data)), time.Minute*15)
	t.cache.Wait()
}

func (t Templates) GetTemplateInitialValues(repo, path, version, sourceType string) (map[string]interface{}, bool) {
	data, found := t.cache.Get(initialValuesKey(repo, path, version, sourceType))
	if !found {
		return nil, false
	}

	values, ok := data.(map[string]interface{})
	if !ok {
		return nil, false
	}

	return values, ok
}

func (t Templates) SetTemplateInitialValues(repo, path, version, sourceType string, values map[string]interface{}) {
	data, err := json.Marshal(values)
	if err != nil {
		return
	}

	t.cache.SetWithTTL(initialValuesKey(repo, path, version, sourceType), values, int64(len(data)), time.Minute*15)
	t.cache.Wait()
}

func (t Templates) ReturnCache() *ristretto.Cache {
	return t.cache
}

func templateKey(repo, path, version, sourceType string) string {
	return fmt.Sprintf("template:%v:%v/%v@%v", sourceType, repo, path, version)
}

func initialValuesKey(repo, path, version, sourceType string) string {
	return fmt.Sprintf("initialValues:%v:%v/%v@%v", sourceType, repo, path, version)
}

package cache

import (
	"fmt"
	"time"

	"github.com/dgraph-io/ristretto"
	json "github.com/json-iterator/go"

	"github.com/cyclops-ui/cycops-ctrl/internal/models"
)

type Templates struct {
	cache *ristretto.Cache
}

func NewInMemoryTemplatesCache() Templates {
	cache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 1e7,     // number of keys to track frequency of (10M).
		MaxCost:     1 << 30, // maximum cost of cache (1GB).
		BufferItems: 64,      // number of keys per Get buffer.
	})
	if err != nil {
		panic(err)
	}

	return Templates{
		cache: cache,
	}
}

func (t Templates) GetTemplate(repo, path, version string) (*models.Template, bool) {
	value, found := t.cache.Get(templateKey(repo, path, version))
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

func (t Templates) SetTemplate(repo, path, version string, template *models.Template) {
	data, err := json.Marshal(template)
	if err != nil {
		return
	}

	t.cache.SetWithTTL(templateKey(repo, path, version), data, int64(len(data)), time.Minute*15)
	t.cache.Wait()
}

func (t Templates) GetTemplateInitialValues(repo, path, version string) (map[interface{}]interface{}, bool) {
	data, found := t.cache.Get(initialValuesKey(repo, path, version))
	if !found {
		return nil, false
	}

	values, ok := data.(map[interface{}]interface{})
	if !ok {
		return nil, false
	}

	return values, ok
}

func (t Templates) SetTemplateInitialValues(repo, path, version string, values map[interface{}]interface{}) {
	data, err := json.Marshal(values)
	if err != nil {
		return
	}

	t.cache.SetWithTTL(initialValuesKey(repo, path, version), values, int64(len(data)), time.Minute*15)
	t.cache.Wait()
}

func templateKey(repo, path, version string) string {
	return fmt.Sprintf("template:%v/%v@%v", repo, path, version)
}

func initialValuesKey(repo, path, version string) string {
	return fmt.Sprintf("initialValues:%v/%v@%v", repo, path, version)
}

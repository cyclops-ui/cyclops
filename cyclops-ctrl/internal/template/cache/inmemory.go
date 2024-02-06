package cache

import (
	"encoding/json"
	"fmt"

	"github.com/dgraph-io/ristretto"

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

	template, ok := value.(models.Template)
	if !ok {
		return nil, false
	}

	return &template, ok
}

func (t Templates) SetTemplate(repo, path, version string, template *models.Template) {
	data, err := json.Marshal(template)
	if err != nil {
		return
	}

	t.cache.Set(templateKey(repo, path, version), *template, int64(len(data)))
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
	t.cache.Set(initialValuesKey(repo, path, version), values, int64(len(values)))
	t.cache.Wait()
}

func templateKey(repo, path, version string) string {
	return fmt.Sprintf("template:%v/%v@%v", repo, path, version)
}

func initialValuesKey(repo, path, version string) string {
	return fmt.Sprintf("initialValues:%v/%v@%v", repo, path, version)
}

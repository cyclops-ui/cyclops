package cache

import (
	"fmt"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/dgraph-io/ristretto"
	"unsafe"
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

func (t Templates) Get(repo, path, version string) (*models.Template, bool) {
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

func (t Templates) Set(repo, path, version string, template *models.Template) {
	t.cache.Set(templateKey(repo, path, version), *template, int64(unsafe.Sizeof(*template)))
	t.cache.Wait()
}

func templateKey(repo, path, version string) string {
	return fmt.Sprintf("%v/%v@%v", repo, path, version)
}

package prometheus

import (
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/go-logr/logr"
	"github.com/prometheus/client_golang/prometheus"
	"sigs.k8s.io/controller-runtime/pkg/metrics"
)

type Monitor struct {
	ModulesDeployed  prometheus.Gauge
	CacheHits        prometheus.Counter
	CacheMisses      prometheus.Counter
	CacheKeysAdded   prometheus.Counter
	CacheCostAdded   prometheus.Counter
	CacheKeysEvicted prometheus.Counter
	CacheCostEvicted prometheus.Counter
}

func NewMonitor(logger logr.Logger) (Monitor, error) {

	m := Monitor{
		ModulesDeployed: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "modules_deployed",
			Help:      "No of modules Inc or Dec",
			Namespace: "cyclops",
		}),
		CacheHits: prometheus.NewCounter(prometheus.CounterOpts{
			Name:      "cache_hits",
			Help:      "No of cache hits",
			Namespace: "cyclops",
		}),
		CacheMisses: prometheus.NewCounter(prometheus.CounterOpts{
			Name:      "cache_misses",
			Help:      "No of cache misses",
			Namespace: "cyclops",
		}),
		CacheKeysAdded: prometheus.NewCounter(prometheus.CounterOpts{
			Name:      "cache_keys_added",
			Help:      "No of cache keys added",
			Namespace: "cyclops",
		}),
		CacheCostAdded: prometheus.NewCounter(prometheus.CounterOpts{
			Name:      "cache_cost_added",
			Help:      "No of cache cost added",
			Namespace: "cyclops",
		}),
		CacheKeysEvicted: prometheus.NewCounter(prometheus.CounterOpts{
			Name:      "cache_keys_evicted",
			Help:      "No of cache keys evicted",
			Namespace: "cyclops",
		}),
		CacheCostEvicted: prometheus.NewCounter(prometheus.CounterOpts{
			Name:      "cache_cost_evicted",
			Help:      "No of cache cost evicted",
			Namespace: "cyclops",
		}),
	}

	metricsList :=
		[]prometheus.Collector{
			m.ModulesDeployed,
			m.CacheHits,
			m.CacheMisses,
			m.CacheKeysAdded,
			m.CacheCostAdded,
			m.CacheKeysEvicted,
			m.CacheCostEvicted,
		}

	for _, metric := range metricsList {
		if err := metrics.Registry.Register(metric); err != nil {
			logger.Error(err, "unable to connect prometheus")
			return Monitor{}, err
		}
	}

	return m, nil
}

func (m *Monitor) IncModule() {
	m.ModulesDeployed.Inc()
}

func (m *Monitor) DecModule() {
	m.ModulesDeployed.Dec()
}

func (m *Monitor) UpdateCacheMetrics(cache *ristretto.Cache) {
	cacheMetrics := cache.Metrics

	m.CacheHits.Add(float64(cacheMetrics.Hits()))
	m.CacheMisses.Add(float64(cacheMetrics.Misses()))
	m.CacheKeysAdded.Add(float64(cacheMetrics.KeysAdded()))
	m.CacheCostAdded.Add(float64(cacheMetrics.CostAdded()))
	m.CacheKeysEvicted.Add(float64(cacheMetrics.KeysEvicted()))
	m.CacheCostEvicted.Add(float64(cacheMetrics.CostEvicted()))
}

func StartCacheMetricsUpdater(m *Monitor, cache *ristretto.Cache, interval time.Duration, logger logr.Logger) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		logger.Info("starting cache metrics updater")

		for range ticker.C {
			m.UpdateCacheMetrics(cache)
		}
	}()
}

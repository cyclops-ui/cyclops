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
	CacheHits        prometheus.Gauge
	CacheMisses      prometheus.Gauge
	CacheKeysAdded   prometheus.Gauge
	CacheCostAdded   prometheus.Gauge
	CacheKeysEvicted prometheus.Gauge
	CacheCostEvicted prometheus.Gauge

	// Reconciler Metrics
	ReconcilerDuration   prometheus.Histogram
	NoOfReconciliations   prometheus.Counter
	FailedReconciliations prometheus.Counter
}

func NewMonitor(logger logr.Logger) (Monitor, error) {

	m := Monitor{
		ModulesDeployed: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "modules_deployed",
			Help:      "No of modules Inc or Dec",
			Namespace: "cyclops",
		}),
		CacheHits: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "cache_hits",
			Help:      "No of cache hits",
			Namespace: "cyclops",
		}),
		CacheMisses: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "cache_misses",
			Help:      "No of cache misses",
			Namespace: "cyclops",
		}),
		CacheKeysAdded: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "cache_keys_added",
			Help:      "No of cache keys added",
			Namespace: "cyclops",
		}),
		CacheCostAdded: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "cache_cost_added",
			Help:      "No of cache cost added",
			Namespace: "cyclops",
		}),
		CacheKeysEvicted: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "cache_keys_evicted",
			Help:      "No of cache keys evicted",
			Namespace: "cyclops",
		}),
		CacheCostEvicted: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "cache_cost_evicted",
			Help:      "No of cache cost evicted",
			Namespace: "cyclops",
		}),
		ReconcilerDuration: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:      "reconciler_duration_seconds",
			Help:      "Duration of reconciler",
			Namespace: "cyclops",
			Buckets:   prometheus.DefBuckets,
		}),
		NoOfReconciliations: prometheus.NewCounter(prometheus.CounterOpts{
			Name:      "no_of_reconciliations",
			Help:      "No of reconciliations",
			Namespace: "cyclops",
		}),
		FailedReconciliations: prometheus.NewCounter(prometheus.CounterOpts{
			Name:      "failed_reconciliations",
			Help:      "No of failed reconciliations",
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
			m.ReconcilerDuration,
			m.NoOfReconciliations,
			m.FailedReconciliations,
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

func (m *Monitor) IncNoOfReconciliations() {
	m.NoOfReconciliations.Inc()
}

func (m *Monitor) IncFailedReconciliations() {
	m.FailedReconciliations.Inc()
}

func (m *Monitor) ObserveReconcilerDuration(duration float64) {
	m.ReconcilerDuration.Observe(duration)
}

func (m *Monitor) UpdateCacheMetrics(cache *ristretto.Cache) {
	cacheMetrics := cache.Metrics

	m.CacheHits.Set(float64(cacheMetrics.Hits()))
	m.CacheMisses.Set(float64(cacheMetrics.Misses()))
	m.CacheKeysAdded.Set(float64(cacheMetrics.KeysAdded()))
	m.CacheCostAdded.Set(float64(cacheMetrics.CostAdded()))
	m.CacheKeysEvicted.Set(float64(cacheMetrics.KeysEvicted()))
	m.CacheCostEvicted.Set(float64(cacheMetrics.CostEvicted()))
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

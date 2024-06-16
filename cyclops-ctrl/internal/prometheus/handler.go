package prometheus

import (
	"github.com/go-logr/logr"
	"github.com/prometheus/client_golang/prometheus"
	"sigs.k8s.io/controller-runtime/pkg/metrics"
)

type Monitor struct {
	ModulesDeployed prometheus.Gauge
}

func NewMonitor(logger logr.Logger) (Monitor, error) {
	m := Monitor{
		ModulesDeployed: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "modules_deployed",
			Help:      "No of modules Inc or Dec",
			Namespace: "cyclops",
		}),
	}
	if err := metrics.Registry.Register(m.ModulesDeployed); err != nil {
		logger.Error(err, "unable to connect prometheus")
		return Monitor{}, err
	}

	return m, nil
}

func (m *Monitor) IncModule() {
	m.ModulesDeployed.Inc()
}

func (m *Monitor) DecModule() {
	m.ModulesDeployed.Dec()
}

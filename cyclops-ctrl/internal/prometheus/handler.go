package prometheus

import (
	"github.com/gin-gonic/gin"
	"github.com/go-logr/logr"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
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
	if err := prometheus.Register(m.ModulesDeployed); err != nil {
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

func PromHandler() gin.HandlerFunc {
	return gin.WrapH(promhttp.Handler())
}

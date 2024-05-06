package prometheusHandler

import (
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	ctrl "sigs.k8s.io/controller-runtime"
)

var setupLog = ctrl.Log.WithName("setup")

type Monitor struct {
	ModulesDeployed prometheus.Gauge
}

func NewMonitor() (Monitor, error) {
	m := Monitor{
		ModulesDeployed: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "modules_deployed",
			Help:      "No of modules Inc or Dec",
			Namespace: "cyclops",
		}),
	}
	if err := prometheus.Register(m.ModulesDeployed); err != nil {
		setupLog.Error(err, "unable to connect prometheus")
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

package prometheusHandler

import (
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var moduleQueued = prometheus.NewGauge(prometheus.GaugeOpts{
	Name:      "Modules",
	Help:      "No of modules Inc or Dec",
	Namespace: "cyclops",
})

func init() {
	prometheus.MustRegister(moduleQueued)
}

func IncModule() {
	moduleQueued.Inc()
}

func DecModule() {
	moduleQueued.Dec()
}

func PromHandler() gin.HandlerFunc {
	return gin.WrapH(promhttp.Handler())
}

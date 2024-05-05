package prometheusHandler

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	ctrl "sigs.k8s.io/controller-runtime"
)

var setupLog = ctrl.Log.WithName("setup")

var moduleQueued = prometheus.NewGauge(prometheus.GaugeOpts{
	Name:      "modules_deployed",
	Help:      "No of modules Inc or Dec",
	Namespace: "cyclops",
})

func init() {
	if err := prometheus.Register(moduleQueued); err != nil {
		setupLog.Error(err, "unable to connect prometheus")
		os.Exit(1)
	}
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

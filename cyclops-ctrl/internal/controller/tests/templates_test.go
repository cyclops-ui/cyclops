package tests

import (
	"net/http/httptest"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/controller"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/mocks"
	"github.com/gin-gonic/gin"
	. "github.com/onsi/ginkgo/v2"
)

var _ = Describe("Templates controller test", func() {
	var templatesController *controller.Templates
	var w *httptest.ResponseRecorder
	var ctx *gin.Context
	var k8sClient *mocks.IKubernetesClient
	var r *gin.Engine

	BeforeEach(func() {
		gin.SetMode(gin.TestMode)
		k8sClient = &mocks.IKubernetesClient{}
		templatesController = controller.NewTemplatesController(nil, k8sClient, nil)
		w = httptest.NewRecorder()
		ctx, r = gin.CreateTestContext(w)

		templatesController.GetTemplate(ctx)
	})

	Describe("ListNodes method", func() {
		BeforeEach(func() {
			r.GET("/templates", templatesController.GetTemplate)
		})

		Describe("error", func() {

		})

	})
})

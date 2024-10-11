package tests

import (
	"errors"
	"fmt"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/mocks"
	json "github.com/json-iterator/go"
	"io"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/controller"
	k8smocks "github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/mocks"
)

var _ = Describe("Templates controller test", func() {
	var templatesController *controller.Templates
	var w *httptest.ResponseRecorder
	var ctx *gin.Context
	var templatesRepo *mocks.ITemplateRepo
	var k8sClient *k8smocks.IKubernetesClient
	var r *gin.Engine

	BeforeEach(func() {
		gin.SetMode(gin.TestMode)
		k8sClient = &k8smocks.IKubernetesClient{}
		templatesRepo = &mocks.ITemplateRepo{}
		templatesController = controller.NewTemplatesController(templatesRepo, k8sClient, nil)
		w = httptest.NewRecorder()
		ctx, r = gin.CreateTestContext(w)
	})

	Describe("GetTemplate method", func() {
		BeforeEach(func() {
			r.GET("/templates", templatesController.GetTemplate)
		})

		type caseInput struct {
			repo       string
			path       string
			version    string
			sourceType string
			mockCalls  func()
		}

		type caseOutput struct {
			template   *models.Template
			statusCode int
		}

		type testCase struct {
			description string
			in          caseInput
			out         caseOutput
		}

		expectedTemplate := &models.Template{
			Name:            "api-template",
			Version:         "main",
			ResolvedVersion: "commit-sha",
			IconURL:         "https://my-org/icon.png",
		}

		testCases := []testCase{
			{
				description: "fails on empty template repo",
				in: caseInput{
					repo:      "",
					mockCalls: func() {},
				},
				out: caseOutput{
					template:   nil,
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails to fetch a template from the templates repo",
				in: caseInput{
					repo:       "https://github.com/my-org/templates",
					path:       "charts/api",
					version:    "main",
					sourceType: "git",
					mockCalls: func() {
						templatesRepo.On(
							"GetTemplate", "https://github.com/my-org/templates", "charts/api", "main", "", v1alpha1.TemplateSourceTypeGit,
						).Return(nil, errors.New("some template error"))
					},
				},
				out: caseOutput{
					template:   nil,
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "successfully fetches template",
				in: caseInput{
					repo:       "https://github.com/my-org/templates",
					path:       "charts/api",
					version:    "main",
					sourceType: "git",
					mockCalls: func() {
						templatesRepo.On(
							"GetTemplate", "https://github.com/my-org/templates", "charts/api", "main", "", v1alpha1.TemplateSourceTypeGit,
						).Return(expectedTemplate, nil)
					},
				},
				out: caseOutput{
					template:   expectedTemplate,
					statusCode: http.StatusOK,
				},
			},
		}

		for _, t := range testCases {
			Describe(t.description, func() {
				BeforeEach(func() {
					t.in.mockCalls()
				})

				It("returns correct template and status code", func() {
					req, _ := http.NewRequest(http.MethodGet,
						fmt.Sprintf("/templates?repo=%v&path=%v&commit=%v&sourceType=%v",
							t.in.repo, t.in.path, t.in.version, t.in.sourceType),
						nil)
					ctx.Request = req
					r.ServeHTTP(w, req)

					Expect(w.Code).To(BeEquivalentTo(t.out.statusCode))
					if t.out.template != nil {
						b, err := io.ReadAll(w.Result().Body)
						Expect(err).To(BeNil())

						var actual *models.Template
						err = json.Unmarshal(b, &actual)

						Expect(*actual).To(BeEquivalentTo(*t.out.template))
					}
				})
			})
		}
	})

	Describe("GetTemplateInitialValues method", func() {
		BeforeEach(func() {
			r.GET("/templates/initial", templatesController.GetTemplateInitialValues)
		})

		type caseInput struct {
			repo       string
			path       string
			version    string
			sourceType string
			mockCalls  func()
		}

		type caseOutput struct {
			initialValues map[string]interface{}
			statusCode    int
		}

		type testCase struct {
			description string
			in          caseInput
			out         caseOutput
		}

		brokenValues := map[string]interface{}{
			"name":    "api-name",
			"invalid": make(chan int),
			"networking": map[interface{}]interface{}{
				"cpu":    float64(3),
				"memory": "2Gi",
			},
		}
		expectedValues := map[string]interface{}{
			"name":     "api-name",
			"replicas": float64(3),
			"networking": map[string]interface{}{
				"cpu":    float64(3),
				"memory": "2Gi",
			},
		}

		testCases := []testCase{
			{
				description: "fails on empty template repo",
				in: caseInput{
					repo:      "",
					mockCalls: func() {},
				},
				out: caseOutput{
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails to fetch a template initial values from the templates repo",
				in: caseInput{
					repo:       "https://github.com/my-org/templates",
					path:       "charts/api",
					version:    "main",
					sourceType: "git",
					mockCalls: func() {
						templatesRepo.On(
							"GetTemplateInitialValues", "https://github.com/my-org/templates", "charts/api", "main", v1alpha1.TemplateSourceTypeGit,
						).Return(nil, errors.New("some template error"))
					},
				},
				out: caseOutput{
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails to marshal initial values",
				in: caseInput{
					repo:       "https://github.com/my-org/templates",
					path:       "charts/api",
					version:    "main",
					sourceType: "git",
					mockCalls: func() {
						templatesRepo.On(
							"GetTemplateInitialValues", "https://github.com/my-org/templates", "charts/api", "main", v1alpha1.TemplateSourceTypeGit,
						).Return(brokenValues, nil)
					},
				},
				out: caseOutput{
					initialValues: expectedValues,
					statusCode:    http.StatusBadRequest,
				},
			},
			{
				description: "successfully fetches template",
				in: caseInput{
					repo:       "https://github.com/my-org/templates",
					path:       "charts/api",
					version:    "main",
					sourceType: "git",
					mockCalls: func() {
						templatesRepo.On(
							"GetTemplateInitialValues", "https://github.com/my-org/templates", "charts/api", "main", v1alpha1.TemplateSourceTypeGit,
						).Return(expectedValues, nil)
					},
				},
				out: caseOutput{
					initialValues: expectedValues,
					statusCode:    http.StatusOK,
				},
			},
		}

		for _, t := range testCases {
			Describe(t.description, func() {
				BeforeEach(func() {
					t.in.mockCalls()
				})

				It("returns correct template and status code", func() {
					req, _ := http.NewRequest(http.MethodGet,
						fmt.Sprintf("/templates/initial?repo=%v&path=%v&commit=%v&sourceType=%v",
							t.in.repo, t.in.path, t.in.version, t.in.sourceType),
						nil)
					ctx.Request = req
					r.ServeHTTP(w, req)

					Expect(w.Code).To(BeEquivalentTo(t.out.statusCode))
					if t.out.statusCode == http.StatusOK {
						b, err := io.ReadAll(w.Result().Body)
						Expect(err).To(BeNil())

						var actual map[string]interface{}
						err = json.Unmarshal(b, &actual)

						Expect(actual).To(BeEquivalentTo(t.out.initialValues))
					}
				})
			})
		}
	})
})

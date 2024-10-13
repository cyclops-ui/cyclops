package tests

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/telemetry"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/mocks"
	"github.com/gin-gonic/gin"
	json "github.com/json-iterator/go"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"io"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"net/http/httptest"

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
		templatesController = controller.NewTemplatesController(templatesRepo, k8sClient, telemetry.MockClient{})
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

	Describe("ListTemplatesStore method", func() {
		BeforeEach(func() {
			r.GET("/templates/store", templatesController.ListTemplatesStore)
		})

		type caseInput struct {
			mockCalls func()
		}

		type caseOutput struct {
			templateStores []dto.TemplateStore
			statusCode     int
		}

		type testCase struct {
			description string
			in          caseInput
			out         caseOutput
		}

		testCases := []testCase{
			{
				description: "fails fetching template stores",
				in: caseInput{
					mockCalls: func() {
						k8sClient.On("ListTemplateStore").Return(nil, errors.New("some k8s error"))
					},
				},
				out: caseOutput{
					statusCode: http.StatusInternalServerError,
				},
			},
			{
				description: "returns no template stores",
				in: caseInput{
					mockCalls: func() {
						k8sClient.On("ListTemplateStore").Return([]v1alpha1.TemplateStore{}, nil)
					},
				},
				out: caseOutput{
					templateStores: []dto.TemplateStore{},
					statusCode:     http.StatusOK,
				},
			},
			{
				description: "returns template stores",
				in: caseInput{
					mockCalls: func() {
						k8sClient.On("ListTemplateStore").Return([]v1alpha1.TemplateStore{
							{
								ObjectMeta: v1.ObjectMeta{Name: "demo-git"},
								Spec: v1alpha1.TemplateRef{
									URL:        "https://github.com/cyclops-ui/templates",
									Path:       "demo",
									Version:    "main",
									SourceType: "git",
								},
							},
							{
								ObjectMeta: v1.ObjectMeta{Name: "app-oci", Annotations: map[string]string{
									"cyclops-ui.com/icon": "https://myicons/icon.png",
								}},
								Spec: v1alpha1.TemplateRef{
									URL:        "oci://dockerhub.com/cyclops-ui",
									Path:       "app",
									Version:    "2.x.x",
									SourceType: "oci",
								},
							},
						}, nil)
					},
				},
				out: caseOutput{
					templateStores: []dto.TemplateStore{
						{
							Name:    "demo-git",
							IconURL: "",
							TemplateRef: dto.Template{
								URL:        "https://github.com/cyclops-ui/templates",
								Path:       "demo",
								Version:    "main",
								SourceType: "git",
							},
						},
						{
							Name:    "app-oci",
							IconURL: "https://myicons/icon.png",
							TemplateRef: dto.Template{
								URL:        "oci://dockerhub.com/cyclops-ui",
								Path:       "app",
								Version:    "2.x.x",
								SourceType: "oci",
							},
						},
					},
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
					req, _ := http.NewRequest(http.MethodGet, "/templates/store", nil)
					ctx.Request = req
					r.ServeHTTP(w, req)

					Expect(w.Code).To(BeEquivalentTo(t.out.statusCode))
					if t.out.statusCode == http.StatusOK {
						b, err := io.ReadAll(w.Result().Body)
						Expect(err).To(BeNil())

						var actual []dto.TemplateStore
						err = json.Unmarshal(b, &actual)

						Expect(actual).To(BeEquivalentTo(t.out.templateStores))
					}
				})
			})
		}
	})

	Describe("CreateTemplatesStore method", func() {
		BeforeEach(func() {
			r.PUT("/templates/store", templatesController.CreateTemplatesStore)
		})

		type caseInput struct {
			templateStore *dto.TemplateStore
			mockCalls     func()
		}

		type caseOutput struct {
			statusCode int
		}

		type testCase struct {
			description string
			in          caseInput
			out         caseOutput
		}

		testCases := []testCase{
			{
				description: "fails binding request",
				in: caseInput{
					templateStore: &dto.TemplateStore{IconURL: "some-icon.png", TemplateRef: dto.Template{}},
					mockCalls:     func() {},
				},
				out: caseOutput{
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails on empty template repo",
				in: caseInput{
					templateStore: &dto.TemplateStore{Name: "my-new-template", IconURL: "some-icon.png", TemplateRef: dto.Template{
						Path:    "charts/demo",
						Version: "main",
					}},
					mockCalls: func() {},
				},
				out: caseOutput{
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails fetching template from source",
				in: caseInput{
					templateStore: &dto.TemplateStore{Name: "my-new-template", IconURL: "some-icon.png", TemplateRef: dto.Template{
						URL:        "https://github.com/cyclops-ui/templates",
						Path:       "charts/demo",
						Version:    "main",
						SourceType: "git",
					}},
					mockCalls: func() {
						templatesRepo.On("GetTemplate",
							"https://github.com/cyclops-ui/templates",
							"charts/demo",
							"main",
							"",
							v1alpha1.TemplateSourceTypeGit,
						).Return(nil, errors.New("some template error"))
					},
				},
				out: caseOutput{
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails creating template on k8s api",
				in: caseInput{
					templateStore: &dto.TemplateStore{Name: "new-template", IconURL: "some-icon.png", TemplateRef: dto.Template{
						URL:        "https://github.com/cyclops-ui/templates",
						Path:       "charts/demo",
						Version:    "main",
						SourceType: "git",
					}},
					mockCalls: func() {
						templatesRepo.On("GetTemplate",
							"https://github.com/cyclops-ui/templates",
							"charts/demo",
							"main",
							"",
							v1alpha1.TemplateSourceTypeGit,
						).Return(&models.Template{Name: "new-template", IconURL: "some-icon.png"}, nil)
						k8sClient.On("CreateTemplateStore", &v1alpha1.TemplateStore{
							TypeMeta: v1.TypeMeta{
								Kind:       "TemplateStore",
								APIVersion: "cyclops-ui.com/v1alpha1",
							},
							ObjectMeta: v1.ObjectMeta{
								Name: "new-template",
								Annotations: map[string]string{
									"cyclops-ui.com/icon": "some-icon.png",
								},
							},
							Spec: v1alpha1.TemplateRef{
								URL:        "https://github.com/cyclops-ui/templates",
								Path:       "charts/demo",
								Version:    "main",
								SourceType: v1alpha1.TemplateSourceTypeGit,
							},
						}).Return(errors.New("some k8s error"))
					},
				},
				out: caseOutput{
					statusCode: http.StatusInternalServerError,
				},
			},
			{
				description: "creates template on k8s api",
				in: caseInput{
					templateStore: &dto.TemplateStore{Name: "new-template", IconURL: "some-icon.png", TemplateRef: dto.Template{
						URL:        "https://github.com/cyclops-ui/templates",
						Path:       "charts/demo",
						Version:    "main",
						SourceType: "git",
					}},
					mockCalls: func() {
						templatesRepo.On("GetTemplate",
							"https://github.com/cyclops-ui/templates",
							"charts/demo",
							"main",
							"",
							v1alpha1.TemplateSourceTypeGit,
						).Return(&models.Template{Name: "new-template", IconURL: "some-icon.png"}, nil)
						k8sClient.On("CreateTemplateStore", &v1alpha1.TemplateStore{
							TypeMeta: v1.TypeMeta{
								Kind:       "TemplateStore",
								APIVersion: "cyclops-ui.com/v1alpha1",
							},
							ObjectMeta: v1.ObjectMeta{
								Name: "new-template",
								Annotations: map[string]string{
									"cyclops-ui.com/icon": "some-icon.png",
								},
							},
							Spec: v1alpha1.TemplateRef{
								URL:        "https://github.com/cyclops-ui/templates",
								Path:       "charts/demo",
								Version:    "main",
								SourceType: v1alpha1.TemplateSourceTypeGit,
							},
						}).Return(nil)
					},
				},
				out: caseOutput{
					statusCode: http.StatusCreated,
				},
			},
		}

		for _, t := range testCases {
			Describe(t.description, func() {
				BeforeEach(func() {
					t.in.mockCalls()
				})

				It("returns correct template and status code", func() {
					data, err := json.Marshal(t.in.templateStore)
					Expect(err).To(BeNil())

					req, _ := http.NewRequest(http.MethodPut, "/templates/store", bytes.NewBuffer(data))
					req.Header.Set("Content-Type", "application/json")

					ctx.Request = req
					r.ServeHTTP(w, req)

					Expect(w.Code).To(BeEquivalentTo(t.out.statusCode))
				})
			})
		}
	})

	Describe("EditTemplatesStore method", func() {
		BeforeEach(func() {
			r.POST("/templates/store/:name", templatesController.EditTemplatesStore)
		})

		type caseInput struct {
			templateName  string
			templateStore *dto.TemplateStore
			mockCalls     func()
		}

		type caseOutput struct {
			statusCode int
		}

		type testCase struct {
			description string
			in          caseInput
			out         caseOutput
		}

		testCases := []testCase{
			{
				description: "fails binding request",
				in: caseInput{
					templateName:  "my-template",
					templateStore: &dto.TemplateStore{IconURL: "some-icon.png", TemplateRef: dto.Template{}},
					mockCalls:     func() {},
				},
				out: caseOutput{
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails on empty template repo",
				in: caseInput{
					templateName: "my-template",
					templateStore: &dto.TemplateStore{Name: "my-template", IconURL: "some-icon.png", TemplateRef: dto.Template{
						Path:    "charts/demo",
						Version: "main",
					}},
					mockCalls: func() {},
				},
				out: caseOutput{
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails fetching template from source",
				in: caseInput{
					templateName: "my-template",
					templateStore: &dto.TemplateStore{Name: "my-template", IconURL: "some-icon.png", TemplateRef: dto.Template{
						URL:        "https://github.com/cyclops-ui/templates",
						Path:       "charts/demo",
						Version:    "main",
						SourceType: "git",
					}},
					mockCalls: func() {
						templatesRepo.On("GetTemplate",
							"https://github.com/cyclops-ui/templates",
							"charts/demo",
							"main",
							"",
							v1alpha1.TemplateSourceTypeGit,
						).Return(nil, errors.New("some template error"))
					},
				},
				out: caseOutput{
					statusCode: http.StatusBadRequest,
				},
			},
			{
				description: "fails updating template on k8s api",
				in: caseInput{
					templateName: "my-template",
					templateStore: &dto.TemplateStore{Name: "my-template", IconURL: "some-icon.png", TemplateRef: dto.Template{
						URL:        "https://github.com/cyclops-ui/templates",
						Path:       "charts/demo",
						Version:    "main",
						SourceType: "git",
					}},
					mockCalls: func() {
						templatesRepo.On("GetTemplate",
							"https://github.com/cyclops-ui/templates",
							"charts/demo",
							"main",
							"",
							v1alpha1.TemplateSourceTypeGit,
						).Return(&models.Template{Name: "my-template", IconURL: "some-icon.png"}, nil)
						k8sClient.On("UpdateTemplateStore", &v1alpha1.TemplateStore{
							TypeMeta: v1.TypeMeta{
								Kind:       "TemplateStore",
								APIVersion: "cyclops-ui.com/v1alpha1",
							},
							ObjectMeta: v1.ObjectMeta{
								Name: "my-template",
								Annotations: map[string]string{
									"cyclops-ui.com/icon": "some-icon.png",
								},
							},
							Spec: v1alpha1.TemplateRef{
								URL:        "https://github.com/cyclops-ui/templates",
								Path:       "charts/demo",
								Version:    "main",
								SourceType: v1alpha1.TemplateSourceTypeGit,
							},
						}).Return(errors.New("some k8s error"))
					},
				},
				out: caseOutput{
					statusCode: http.StatusInternalServerError,
				},
			},
			{
				description: "updates template on k8s api",
				in: caseInput{
					templateName: "my-template",
					templateStore: &dto.TemplateStore{Name: "my-template", IconURL: "some-icon.png", TemplateRef: dto.Template{
						URL:        "https://github.com/cyclops-ui/templates",
						Path:       "charts/demo",
						Version:    "main",
						SourceType: "git",
					}},
					mockCalls: func() {
						templatesRepo.On("GetTemplate",
							"https://github.com/cyclops-ui/templates",
							"charts/demo",
							"main",
							"",
							v1alpha1.TemplateSourceTypeGit,
						).Return(&models.Template{Name: "my-template", IconURL: "some-icon.png"}, nil)
						k8sClient.On("UpdateTemplateStore", &v1alpha1.TemplateStore{
							TypeMeta: v1.TypeMeta{
								Kind:       "TemplateStore",
								APIVersion: "cyclops-ui.com/v1alpha1",
							},
							ObjectMeta: v1.ObjectMeta{
								Name: "my-template",
								Annotations: map[string]string{
									"cyclops-ui.com/icon": "some-icon.png",
								},
							},
							Spec: v1alpha1.TemplateRef{
								URL:        "https://github.com/cyclops-ui/templates",
								Path:       "charts/demo",
								Version:    "main",
								SourceType: v1alpha1.TemplateSourceTypeGit,
							},
						}).Return(nil)
					},
				},
				out: caseOutput{
					statusCode: http.StatusCreated,
				},
			},
		}

		for _, t := range testCases {
			Describe(t.description, func() {
				BeforeEach(func() {
					t.in.mockCalls()
				})

				It("returns correct template and status code", func() {
					data, err := json.Marshal(t.in.templateStore)
					Expect(err).To(BeNil())

					req, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("/templates/store/%v", t.in.templateName), bytes.NewBuffer(data))
					req.Header.Set("Content-Type", "application/json")

					ctx.Request = req
					r.ServeHTTP(w, req)

					Expect(w.Code).To(BeEquivalentTo(t.out.statusCode))
				})
			})
		}
	})

	Describe("DeleteTemplatesStore method", func() {
		BeforeEach(func() {
			r.DELETE("/templates/store/:name", templatesController.DeleteTemplatesStore)
		})

		type caseInput struct {
			templateName string
			mockCalls    func()
		}

		type caseOutput struct {
			statusCode int
		}

		type testCase struct {
			description string
			in          caseInput
			out         caseOutput
		}

		testCases := []testCase{
			{
				description: "fails deleting template",
				in: caseInput{
					templateName: "my-template",
					mockCalls: func() {
						k8sClient.On("DeleteTemplateStore", "my-template").Return(errors.New("some template error"))
					},
				},
				out: caseOutput{
					statusCode: http.StatusInternalServerError,
				},
			},
			{
				description: "successfully deleting template",
				in: caseInput{
					templateName: "my-template",
					mockCalls: func() {
						k8sClient.On("DeleteTemplateStore", "my-template").Return(nil)
					},
				},
				out: caseOutput{
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
					req, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("/templates/store/%v", t.in.templateName), nil)
					req.Header.Set("Content-Type", "application/json")

					ctx.Request = req
					r.ServeHTTP(w, req)

					Expect(w.Code).To(BeEquivalentTo(t.out.statusCode))
				})
			})
		}
	})
})

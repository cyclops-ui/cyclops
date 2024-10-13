package tests

import (
	"io"
	"net/http"
	"net/http/httptest"

	"github.com/pkg/errors"

	"github.com/gin-gonic/gin"
	json "github.com/json-iterator/go"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	v1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	v12 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/controller"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/mocks"
)

var _ = Describe("Cluster controller test", func() {
	var clusterController *controller.Cluster
	var w *httptest.ResponseRecorder
	var ctx *gin.Context
	var k8sClient *mocks.IKubernetesClient
	var r *gin.Engine

	BeforeEach(func() {
		gin.SetMode(gin.TestMode)
		k8sClient = &mocks.IKubernetesClient{}
		clusterController = controller.NewClusterController(k8sClient)
		w = httptest.NewRecorder()
		ctx, r = gin.CreateTestContext(w)
	})

	Describe("ListNodes method", func() {
		BeforeEach(func() {
			r.GET("/nodes", clusterController.ListNodes)
		})

		Describe("error", func() {
			BeforeEach(func() {
				k8sClient.On("ListNodes").Return(nil, errors.New("some k8s errors"))
			})

			It("returns error", func() {
				req, _ := http.NewRequest(http.MethodGet, "/nodes", nil)
				ctx.Request = req
				r.ServeHTTP(w, req)

				Expect(w.Code).To(BeEquivalentTo(http.StatusInternalServerError))
			})
		})

		Describe("success", func() {
			BeforeEach(func() {
				k8sClient.On("ListNodes").Return(getMockNodes(), nil)
			})

			It("returns list of nodes", func() {
				req, _ := http.NewRequest(http.MethodGet, "/nodes", nil)
				ctx.Request = req
				r.ServeHTTP(w, req)

				b, err := io.ReadAll(w.Result().Body)
				Expect(err).To(BeNil())

				var actual []dto.Node
				err = json.Unmarshal(b, &actual)
				Expect(err).To(BeNil())

				expectedNodes := []dto.Node{
					{
						Name: "node-1",
						Node: &v1.Node{
							ObjectMeta: v12.ObjectMeta{Name: "node-1"},
							Status: v1.NodeStatus{
								Allocatable: v1.ResourceList{
									v1.ResourceCPU:    resource.MustParse("4"),
									v1.ResourceMemory: resource.MustParse("16Gi"),
									v1.ResourcePods:   resource.MustParse("110"),
								},
							},
						},
						AvailableResources: dto.NodeResources{CPU: 4000, Memory: 17179869184, PodCount: 110},
					},
					{
						Name: "node-3",
						Node: &v1.Node{
							ObjectMeta: v12.ObjectMeta{Name: "node-3"},
							Status: v1.NodeStatus{
								Allocatable: v1.ResourceList{
									v1.ResourceCPU:    resource.MustParse("6"),
									v1.ResourceMemory: resource.MustParse("32Gi"),
									v1.ResourcePods:   resource.MustParse("150"),
								},
							},
						},
						AvailableResources: dto.NodeResources{CPU: 6000, Memory: 34359738368, PodCount: 150},
					},
				}
				Expect(w.Code).To(BeEquivalentTo(http.StatusOK))
				Expect(actual).To(BeEquivalentTo(expectedNodes))
			})
		})
	})

	Describe("GetNode method", func() {
		BeforeEach(func() {
			r.GET("/nodes/:name", clusterController.GetNode)
		})

		Describe("error fetching node", func() {
			Describe("no node error", func() {
				BeforeEach(func() {
					k8sClient.On("GetNode", "whereisit").Return(nil, k8serrors.NewNotFound(schema.GroupResource{Resource: "nodes"}, "whereisit"))
				})

				It("returns error", func() {
					req, _ := http.NewRequest(http.MethodGet, "/nodes/whereisit", nil)
					ctx.Request = req
					r.ServeHTTP(w, req)

					b, err := io.ReadAll(w.Result().Body)
					Expect(err).To(BeNil())

					var e *dto.Error
					err = json.Unmarshal(b, &e)

					Expect(err).To(BeNil())
					Expect(w.Code).To(BeEquivalentTo(http.StatusBadRequest))
					Expect(e.Message).To(BeEquivalentTo("Node with name does not exist"))
					Expect(e.Description).To(BeEquivalentTo("Check if the provided node name is correct"))
				})
			})

			Describe("other error", func() {
				BeforeEach(func() {
					k8sClient.On("GetNode", "my-node").Return(nil, errors.New("some other k8s error"))
				})

				It("returns error", func() {
					req, _ := http.NewRequest(http.MethodGet, "/nodes/my-node", nil)
					ctx.Request = req
					r.ServeHTTP(w, req)

					Expect(w.Code).To(BeEquivalentTo(http.StatusInternalServerError))
				})
			})
		})

		Describe("error fetching node", func() {
			BeforeEach(func() {
				k8sClient.On("GetNode", "my-node").Return(getMockNode(), nil)
				k8sClient.On("GetPodsForNode", "my-node").Return(nil, k8serrors.NewNotFound(schema.GroupResource{Resource: "nodes"}, "whereisit"))
			})

			It("returns error", func() {
				req, _ := http.NewRequest(http.MethodGet, "/nodes/my-node", nil)
				ctx.Request = req
				r.ServeHTTP(w, req)

				b, err := io.ReadAll(w.Result().Body)
				Expect(err).To(BeNil())

				var e *dto.Error
				err = json.Unmarshal(b, &e)

				Expect(err).To(BeNil())
				Expect(w.Code).To(BeEquivalentTo(http.StatusInternalServerError))
				Expect(e.Message).To(BeEquivalentTo("Error listing pods for node: my-node"))
				Expect(e.Description).To(BeEquivalentTo(""))
			})
		})

		Describe("success", func() {
			BeforeEach(func() {
				k8sClient.On("GetNode", "my-node").Return(getMockNode(), nil)
				k8sClient.On("GetPodsForNode", "my-node").Return(getMockNodePods(), nil)
			})

			It("returns node", func() {
				req, _ := http.NewRequest(http.MethodGet, "/nodes/my-node", nil)
				ctx.Request = req
				r.ServeHTTP(w, req)

				b, err := io.ReadAll(w.Result().Body)
				Expect(err).To(BeNil())

				var actual *dto.Node
				err = json.Unmarshal(b, &actual)
				Expect(err).To(BeNil())

				expectedNode := &dto.Node{
					Name: "my-node",
					Node: &v1.Node{
						ObjectMeta: v12.ObjectMeta{
							Name: "my-node",
						},
						Status: v1.NodeStatus{
							Conditions: []v1.NodeCondition{
								{
									Type:   "MemoryPressure",
									Status: "False",
								},
							},
						},
					},
					Pods: []dto.NodePod{
						{
							Name:      "pod-1",
							Namespace: "default",
							Health:    true,
							CPU:       500,
							Memory:    0,
						},
						{
							Name:      "pod-2",
							Namespace: "kube-system",
							Health:    true,
							CPU:       0,
							Memory:    0,
						},
					},
					AvailableResources: dto.NodeResources{
						CPU:      0,
						Memory:   0,
						PodCount: 0,
					},
					RequestedResources: dto.NodeResources{
						CPU:      500,
						Memory:   0,
						PodCount: 2,
					},
				}

				Expect(err).To(BeNil())
				Expect(w.Code).To(BeEquivalentTo(http.StatusOK))
				Expect(actual).To(BeEquivalentTo(expectedNode))
			})
		})
	})

	Describe("ListNamespaces method", func() {
		BeforeEach(func() {
			r.GET("/namespaces", clusterController.ListNamespaces)
		})

		Describe("error", func() {
			BeforeEach(func() {
				k8sClient.On("ListNamespaces").Return(nil, errors.New("some k8s errors"))
			})

			It("returns error", func() {
				req, _ := http.NewRequest(http.MethodGet, "/namespaces", nil)
				ctx.Request = req
				r.ServeHTTP(w, req)

				Expect(w.Code).To(BeEquivalentTo(http.StatusInternalServerError))
			})
		})

		Describe("success", func() {
			BeforeEach(func() {
				k8sClient.On("ListNamespaces").Return([]string{"default", "my-team", "kube-system"}, nil)
			})

			It("returns list of namespaces", func() {
				req, _ := http.NewRequest(http.MethodGet, "/namespaces", nil)
				ctx.Request = req
				r.ServeHTTP(w, req)

				b, err := io.ReadAll(w.Result().Body)
				Expect(err).To(BeNil())

				var actual []string
				err = json.Unmarshal(b, &actual)

				Expect(err).To(BeNil())
				Expect(w.Code).To(BeEquivalentTo(http.StatusOK))
				Expect(actual).To(BeEquivalentTo([]string{"default", "my-team", "kube-system"}))
			})
		})
	})
})

func getMockNodes() []v1.Node {
	return []v1.Node{
		{
			ObjectMeta: v12.ObjectMeta{
				Name: "node-1",
			},
			Status: v1.NodeStatus{
				Allocatable: v1.ResourceList{
					v1.ResourceCPU:    resource.MustParse("4000m"),
					v1.ResourceMemory: resource.MustParse("16Gi"),
					v1.ResourcePods:   resource.MustParse("110"),
				},
			},
		},
		{
			ObjectMeta: v12.ObjectMeta{
				Name: "node-3",
			},
			Status: v1.NodeStatus{
				Allocatable: v1.ResourceList{
					v1.ResourceCPU:    resource.MustParse("6000m"),
					v1.ResourceMemory: resource.MustParse("32Gi"),
					v1.ResourcePods:   resource.MustParse("150"),
				},
			},
		},
	}
}

func getMockNode() *v1.Node {
	node := &v1.Node{
		ObjectMeta: v12.ObjectMeta{
			Name: "my-node",
		},
		Status: v1.NodeStatus{Conditions: []v1.NodeCondition{
			{
				Type:   v1.NodeMemoryPressure,
				Status: v1.ConditionFalse,
			},
		}},
	}

	return node
}

func getMockNodePods() []v1.Pod {
	return []v1.Pod{
		{
			ObjectMeta: v12.ObjectMeta{
				Name:      "pod-1",
				Namespace: "default",
			},
			Spec: v1.PodSpec{
				Containers: []v1.Container{
					{
						Name: "container-1",
						Resources: v1.ResourceRequirements{
							Requests: v1.ResourceList{
								v1.ResourceCPU: resource.MustParse("500m"),
							},
							Limits: v1.ResourceList{
								v1.ResourceCPU: resource.MustParse("1000m"),
							},
						},
					},
				},
			},
		},
		{
			ObjectMeta: v12.ObjectMeta{
				Name:      "pod-2",
				Namespace: "kube-system",
			},
			Spec: v1.PodSpec{
				Containers: []v1.Container{
					{
						Name: "container-2",
					},
				},
			},
		},
	}
}

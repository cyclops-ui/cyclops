package auth

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/mocks"
	"github.com/pkg/errors"
	apiv1 "k8s.io/api/core/v1"
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestTemplatesResolver(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "test templates resolver")
}

var _ = Describe("Templates resolver", func() {
	var templatesResolver TemplatesResolver
	var k8sClient *mocks.IKubernetesClient

	BeforeEach(func() {
		k8sClient = &mocks.IKubernetesClient{}
		templatesResolver = NewTemplatesResolver(k8sClient)
	})

	type caseInput struct {
		repo      string
		mockCalls func()
	}

	type caseOutput struct {
		credentials  *Credentials
		returnsError bool
	}

	type testCase struct {
		description string
		in          caseInput
		out         caseOutput
	}

	tars := []v1alpha1.TemplateAuthRule{
		{
			Spec: v1alpha1.TemplateAuthRuleSpec{
				Repo: "https://github.com/my-org/some-other-team",
				Username: apiv1.SecretKeySelector{
					LocalObjectReference: apiv1.LocalObjectReference{Name: "wrong-secret"},
					Key:                  "username",
				},
				Password: apiv1.SecretKeySelector{
					LocalObjectReference: apiv1.LocalObjectReference{Name: "wrong-secret"},
					Key:                  "token",
				},
			},
		},
		{
			Spec: v1alpha1.TemplateAuthRuleSpec{
				Repo: "https://github.com/invalid-org/some))-other-team", // invalid regex should not break resolver
				Username: apiv1.SecretKeySelector{
					LocalObjectReference: apiv1.LocalObjectReference{Name: "wrong-secret"},
					Key:                  "username",
				},
				Password: apiv1.SecretKeySelector{
					LocalObjectReference: apiv1.LocalObjectReference{Name: "wrong-secret"},
					Key:                  "token",
				},
			},
		},
		{
			Spec: v1alpha1.TemplateAuthRuleSpec{
				Repo: "https://github.com/my-org/my-team",
				Username: apiv1.SecretKeySelector{
					LocalObjectReference: apiv1.LocalObjectReference{Name: "secret-name"},
					Key:                  "username",
				},
				Password: apiv1.SecretKeySelector{
					LocalObjectReference: apiv1.LocalObjectReference{Name: "secret-name"},
					Key:                  "token",
				},
			},
		},
	}

	testCases := []testCase{
		{
			description: "failed to fetch template auth rules",
			in: caseInput{
				repo: "https://github.com/my-org/my-templates",
				mockCalls: func() {
					k8sClient.On("ListTemplateAuthRules").Return(nil, errors.New("some k8s error"))
				},
			},
			out: caseOutput{
				credentials:  nil,
				returnsError: true,
			},
		},
		{
			description: "fetches no template auth rules",
			in: caseInput{
				repo: "https://github.com/my-org/my-templates",
				mockCalls: func() {
					k8sClient.On("ListTemplateAuthRules").Return(nil, nil)
				},
			},
			out: caseOutput{
				credentials:  nil,
				returnsError: false,
			},
		},
		{
			description: "fetches no matching template auth rules",
			in: caseInput{
				repo: "https://github.com/my-org/my-templates",
				mockCalls: func() {
					k8sClient.On("ListTemplateAuthRules").Return(tars, nil)
				},
			},
			out: caseOutput{
				credentials:  nil,
				returnsError: false,
			},
		},
		{
			description: "failed to fetch username secret",
			in: caseInput{
				repo: "https://github.com/my-org/my-team",
				mockCalls: func() {
					k8sClient.On("ListTemplateAuthRules").Return(tars, nil)
					k8sClient.On("GetTemplateAuthRuleSecret", "secret-name", "username").Return("", errors.New("some k8s error"))
				},
			},
			out: caseOutput{
				credentials:  nil,
				returnsError: true,
			},
		},
		{
			description: "failed to fetch password secret",
			in: caseInput{
				repo: "https://github.com/my-org/my-team",
				mockCalls: func() {
					k8sClient.On("ListTemplateAuthRules").Return(tars, nil)
					k8sClient.On("GetTemplateAuthRuleSecret", "secret-name", "username").Return("my-secret-username", nil)
					k8sClient.On("GetTemplateAuthRuleSecret", "secret-name", "token").Return("", errors.New("some k8s error"))
				},
			},
			out: caseOutput{
				credentials:  nil,
				returnsError: true,
			},
		},
		{
			description: "fetches no matching template auth rules",
			in: caseInput{
				repo: "https://github.com/my-org/my-team",
				mockCalls: func() {
					k8sClient.On("ListTemplateAuthRules").Return(tars, nil)
					k8sClient.On("GetTemplateAuthRuleSecret", "secret-name", "username").Return("my-secret-username", nil)
					k8sClient.On("GetTemplateAuthRuleSecret", "secret-name", "token").Return("my-secret-token", nil)
				},
			},
			out: caseOutput{
				credentials: &Credentials{
					Username: "my-secret-username",
					Password: "my-secret-token",
				},
				returnsError: false,
			},
		},
	}

	for _, t := range testCases {
		Describe(t.description, func() {
			BeforeEach(func() {
				t.in.mockCalls()
			})

			It("returns correct credentials and error", func() {
				actual, err := templatesResolver.RepoAuthCredentials(t.in.repo)
				Expect(err != nil).To(BeEquivalentTo(t.out.returnsError))
				Expect(actual).To(BeEquivalentTo(t.out.credentials))
			})
		})
	}
})

package mapper

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

func TestMapper(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "test mapper")
}

var _ = Describe("Module mapper test", func() {
	Describe("DtoTemplateRefToK8s", func() {
		testCases := []struct {
			in  dto.Template
			out cyclopsv1alpha1.TemplateRef
		}{
			{
				in: dto.Template{
					URL:     "https://my.template.com",
					Path:    "templates",
					Version: "develop",
				},
				out: cyclopsv1alpha1.TemplateRef{
					URL:     "https://my.template.com",
					Path:    "templates",
					Version: "develop",
				},
			},
			{
				in: dto.Template{
					URL:     "oci://my.template.com",
					Path:    "templates",
					Version: "rest-api",
				},
				out: cyclopsv1alpha1.TemplateRef{
					URL:     "oci://my.template.com",
					Path:    "templates",
					Version: "rest-api",
				},
			},
		}

		It("maps template refs correctly", func() {
			for _, testCase := range testCases {
				actual := DtoTemplateRefToK8s(testCase.in)

				Expect(actual).To(BeEquivalentTo(testCase.out))
			}
		})
	})

	Describe("k8sTemplateRefToDTO", func() {
		testCases := []struct {
			in  cyclopsv1alpha1.TemplateRef
			out dto.Template
		}{
			{
				in: cyclopsv1alpha1.TemplateRef{
					URL:     "https://my.template.com",
					Path:    "templates",
					Version: "develop",
				},
				out: dto.Template{
					URL:     "https://my.template.com",
					Path:    "templates",
					Version: "develop",
				},
			},
			{
				in: cyclopsv1alpha1.TemplateRef{
					URL:     "oci://my.template.com",
					Path:    "templates",
					Version: "rest-api",
				},
				out: dto.Template{
					URL:     "oci://my.template.com",
					Path:    "templates",
					Version: "rest-api",
				},
			},
		}

		It("maps template refs correctly", func() {
			for _, testCase := range testCases {
				actual := k8sTemplateRefToDTO(testCase.in)

				Expect(actual).To(BeEquivalentTo(testCase.out))
			}
		})
	})
})

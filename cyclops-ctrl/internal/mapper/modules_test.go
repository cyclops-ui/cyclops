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
		type inCase struct {
			template        cyclopsv1alpha1.TemplateRef
			resolvedVersion string
		}

		testCases := []struct {
			in  inCase
			out dto.Template
		}{
			{
				in: inCase{
					template: cyclopsv1alpha1.TemplateRef{
						URL:     "https://my.template.com",
						Path:    "templates",
						Version: "develop",
					},
					resolvedVersion: "abc123",
				},
				out: dto.Template{
					URL:             "https://my.template.com",
					Path:            "templates",
					Version:         "develop",
					ResolvedVersion: "abc123",
				},
			},
			{
				in: inCase{
					template: cyclopsv1alpha1.TemplateRef{
						URL:     "oci://my.template.com",
						Path:    "templates",
						Version: "0.x.x",
					},
					resolvedVersion: "0.3.4",
				},
				out: dto.Template{
					URL:             "oci://my.template.com",
					Path:            "templates",
					Version:         "0.x.x",
					ResolvedVersion: "0.3.4",
				},
			},
		}

		It("maps template refs correctly", func() {
			for _, testCase := range testCases {
				actual := k8sTemplateRefToDTO(testCase.in.template, testCase.in.resolvedVersion)

				Expect(actual).To(BeEquivalentTo(testCase.out))
			}
		})
	})
})

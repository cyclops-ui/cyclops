package mapper

import (
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"testing"
)

func TestMapper(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "test mapper")
}

var _ = Describe("Helm mapper test", func() {
	Describe("mapHelmPropertyTypeToFieldType test", func() {
		type testCase struct {
			in  helm.Property
			out string
		}

		testCases := []testCase{
			{
				in: helm.Property{
					Type: "string",
				},
				out: "string",
			},
			{
				in: helm.Property{
					Type: "integer",
				},
				out: "number",
			},
			{
				in: helm.Property{
					Type: "boolean",
				},
				out: "boolean",
			},
			{
				in: helm.Property{
					Type: "array",
				},
				out: "array",
			},
			{
				in: helm.Property{
					Type: "object",
				},
				out: "map",
			},
			{
				in: helm.Property{
					Type: "what",
				},
				out: "what",
			},
			{
				in: helm.Property{
					Type:       "string",
					Properties: map[string]helm.Property{"nested": {Type: "string"}},
				},
				out: "string",
			},
			{
				in: helm.Property{
					Type:       "integer",
					Properties: map[string]helm.Property{"nested": {Type: "string"}},
				},
				out: "number",
			},
			{
				in: helm.Property{
					Type:       "boolean",
					Properties: map[string]helm.Property{"nested": {Type: "string"}},
				},
				out: "boolean",
			},
			{
				in: helm.Property{
					Type:       "array",
					Properties: map[string]helm.Property{"nested": {Type: "string"}},
				},
				out: "array",
			},
			{
				in: helm.Property{
					Type:       "object",
					Properties: map[string]helm.Property{"nested": {Type: "string"}},
				},
				out: "object",
			},
			{
				in: helm.Property{
					Type:       "what",
					Properties: map[string]helm.Property{"nested": {Type: "string"}},
				},
				out: "what",
			},
		}

		It("maps correct type values", func() {
			for _, t := range testCases {
				actual := mapHelmPropertyTypeToFieldType(t.in)

				Expect(actual).To(BeEquivalentTo(t.out))
			}
		})
	})

	Describe("mapTitle test", func() {
		Describe("field with populated title", func() {
			name := "fieldName"
			property := helm.Property{Title: "title"}

			out := mapTitle(name, property)

			It("return title override", func() {
				Expect(out).To(BeEquivalentTo(property.Title))
			})
		})

		Describe("field without populated title", func() {
			name := "fieldName"
			property := helm.Property{}

			out := mapTitle(name, property)

			It("return title override", func() {
				Expect(out).To(BeEquivalentTo(name))
			})
		})
	})
})

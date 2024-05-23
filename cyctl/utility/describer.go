package utility

import (
	"bytes"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"text/tabwriter"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"sigs.k8s.io/yaml"
)

type Describer struct {
	Prefix string
	out    *tabwriter.Writer
	buf    *bytes.Buffer
}

func Describe(fn func(d *Describer)) string {
	d := Describer{
		out: new(tabwriter.Writer),
		buf: new(bytes.Buffer),
	}
	d.out.Init(d.buf, 0, 8, 2, ' ', 0)

	fn(&d)

	d.out.Flush()
	return d.buf.String()
}

func (d *Describer) Printf(msg string, args ...interface{}) {
	fmt.Fprint(d.out, d.Prefix)
	fmt.Fprintf(d.out, msg, args...)
}

func (d *Describer) Println(args ...interface{}) {
	fmt.Fprint(d.out, d.Prefix)
	fmt.Fprintln(d.out, args...)
}

// DescribeModuleMetaData describes standard Module metadata in a consistent manner.
func (d *Describer) DescribeModuleMetaData(metadata v1alpha1.Module) {
	d.Printf("Name:\t%s\n", metadata.Name)
	d.Printf("Namespace:\t%s\n", metadata.Namespace)
	d.DescribeMap("Labels", metadata.Labels)
	d.DescribeMap("Annotations", metadata.Annotations)

}

// DescribeTemplateAuthMetaData describes standard TemplateAuthRule metadata in a consistent manner.
func (d *Describer) DescribeTemplateAuthMetaData(metadata v1alpha1.TemplateAuthRule) {
	d.Printf("Name:\t%s\n", metadata.Name)
	d.Printf("Namespace:\t%s\n", metadata.Namespace)
	d.DescribeMap("Labels", metadata.Labels)
	d.DescribeMap("Annotations", metadata.Annotations)

}

// DescribeTemplateStoreMetaData describes standard TemplateStore metadata in a consistent manner.
func (d *Describer) DescribeTemplateStoreMetaData(metadata v1alpha1.TemplateStore) {
	d.Printf("Name:\t%s\n", metadata.Name)
	d.Printf("Namespace:\t%s\n", metadata.Namespace)
	d.DescribeMap("Labels", metadata.Labels)
	d.DescribeMap("Annotations", metadata.Annotations)
}

// DescribeMap describes a map of key-value pairs using name as the heading.
func (d *Describer) DescribeMap(name string, m map[string]string) {
	d.Printf("%s:\t", name)

	first := true
	prefix := ""
	if len(m) > 0 {
		keys := make([]string, 0, len(m))
		for key := range m {
			keys = append(keys, key)
		}
		sort.Strings(keys)
		for _, key := range keys {
			d.Printf("%s%s=%s\n", prefix, key, m[key])
			if first {
				first = false
				prefix = "\t"
			}
		}
	} else {
		d.Printf("<none>\n")
	}
}

// DescribeSlice describes a slice of strings using name as the heading. The output is prefixed by
// "preindent" number of tabs.
func (d *Describer) DescribeSlice(preindent int, name string, s []string) {
	pretab := strings.Repeat("\t", preindent)
	d.Printf("%s%s:\t", pretab, name)

	first := true
	prefix := ""
	if len(s) > 0 {
		for _, x := range s {
			d.Printf("%s%s\n", prefix, x)
			if first {
				first = false
				prefix = pretab + "\t"
			}
		}
	} else {
		d.Printf("%s<none>\n", pretab)
	}
}

// JSONDescriber takes raw JSON bytes and returns a pretty-printed string.
func JSONDescriber(raw []byte) (string, error) {
	var prettyJSON map[string]interface{}
	err := json.Unmarshal(raw, &prettyJSON)
	if err != nil {
		return "", err
	}
	formattedJSON, err := json.MarshalIndent(prettyJSON, "", "  ")
	if err != nil {
		return "", err
	}
	return string(formattedJSON), nil
}

// JsonToYAMLDescriber converts JSON bytes to a YAML formatted string.
func JsonToYAMLDescriber(jsonData []byte) (string, error) {
	yamlData, err := yaml.JSONToYAML(jsonData)
	if err != nil {
		return "", err
	}
	lines := strings.Split(string(yamlData), "\n")
	for i, line := range lines {
		if line != "" {
			lines[i] = "\t" + line
		}
	}
	return strings.Join(lines, "\n"), nil
}

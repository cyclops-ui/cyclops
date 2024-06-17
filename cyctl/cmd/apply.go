package cmd

import (
	"bufio"
	"bytes"
	"io"
	"io/ioutil"
	"net/http"

	utilyaml "k8s.io/apimachinery/pkg/util/yaml"

	"context"
	"encoding/json"
	"fmt"
	"log"

	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/serializer/yaml"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/discovery/cached/memory"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"

	"github.com/spf13/cobra"
)

var decUnstructured = yaml.NewDecodingSerializer(unstructured.UnstructuredJSONScheme)

func doServerSideApply(ctx context.Context, cfg *rest.Config, obj *unstructured.Unstructured) error {
	dc, err := discovery.NewDiscoveryClientForConfig(cfg)
	if err != nil {
		return err
	}
	mapper := restmapper.NewDeferredDiscoveryRESTMapper(memory.NewMemCacheClient(dc))

	dyn, err := dynamic.NewForConfig(cfg)
	if err != nil {
		return err
	}

	mapping, err := mapper.RESTMapping(obj.GroupVersionKind().GroupKind(), obj.GroupVersionKind().Version)
	if err != nil {
		return err
	}

	var dr dynamic.ResourceInterface
	if mapping.Scope.Name() == meta.RESTScopeNameNamespace {
		dr = dyn.Resource(mapping.Resource).Namespace(obj.GetNamespace())
	} else {
		dr = dyn.Resource(mapping.Resource)
	}

	data, err := json.Marshal(obj)
	if err != nil {
		return err
	}

	_, err = dr.Patch(ctx, obj.GetName(), types.ApplyPatchType, data, metav1.PatchOptions{
		FieldManager: "sample-controller",
	})

	return err
}

var applyCmd = &cobra.Command{
	Use:   "init",
	Short: "initialize cyclops with all the resources (along with demo templates)",
	Run: func(cmd *cobra.Command, args []string) {
		version, err := cmd.Flags().GetString("version")
		if err != nil {
			log.Fatal(err)
		}

		var deploy_url string
		var demo_url string

		if version != "main" {
			deploy_url = "https://raw.githubusercontent.com/cyclops-ui/cyclops/v" + version + "/install/cyclops-install.yaml"
			demo_url = "https://raw.githubusercontent.com/cyclops-ui/cyclops/v" + version + "/install/demo-templates.yaml"
		} else {
			deploy_url = "https://raw.githubusercontent.com/cyclops-ui/cyclops/" + version + "/install/cyclops-install.yaml"
			demo_url = "https://raw.githubusercontent.com/cyclops-ui/cyclops/" + version + "/install/demo-templates.yaml"
		}

		deploy, err := http.Get(deploy_url)
		if err != nil {
			log.Fatal(err)
		}

		demo, err := http.Get(demo_url)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println("using version:", version)
		defer deploy.Body.Close()
		defer demo.Body.Close()

		deployYamlFile, err := ioutil.ReadAll(deploy.Body)
		if err != nil {
			log.Printf("yamlFile.Get err   #%v ", err)
		}

		demoYamlFile, err := ioutil.ReadAll(demo.Body)
		if err != nil {
			log.Printf("yamlFile.Get err   #%v ", err)
		}

		fmt.Println("initializing cyclops resources")
		err = applyYaml(deployYamlFile, kubeconfig.Config)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println("initialization successful")
		fmt.Println("creating demo templates")
		err = applyYaml(demoYamlFile, kubeconfig.Config)
		if err != nil {
			log.Fatal(err)
		}
	},
}

func applyYaml(yamlFile []byte, config *rest.Config) error {
	multidocReader := utilyaml.NewYAMLReader(bufio.NewReader(bytes.NewReader(yamlFile)))

	for {
		buf, err := multidocReader.Read()
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}

		obj := &unstructured.Unstructured{}
		_, _, err = decUnstructured.Decode(buf, nil, obj)
		if err != nil {
			return err
		}

		err = doServerSideApply(context.TODO(), config, obj)
		if err != nil {
			return err
		}
	}

	return nil
}

func init() {
	applyCmd.Flags().StringP("version", "v", "main", "specify version for cyclops")
	RootCmd.AddCommand(applyCmd)
}


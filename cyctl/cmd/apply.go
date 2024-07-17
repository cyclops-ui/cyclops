package cmd

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	"io/ioutil"
	"net/http"

	"k8s.io/apimachinery/pkg/types"
	utilyaml "k8s.io/apimachinery/pkg/util/yaml"

	"context"
	"fmt"
	"log"

	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/serializer/yaml"
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
		FieldManager: "cyctl",
	})

	return err
}

func applyYaml(yamlFile []byte, config *rest.Config, telemetry bool) error {
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

		if telemetry && obj.GetKind() == "Deployment" && obj.GetName() == "cyclops-ctrl" {
			containers, _, _ := unstructured.NestedSlice(obj.Object, "spec", "template", "spec", "containers")
			if len(containers) > 0 {
				container := containers[0].(map[string]interface{})
				env, _, _ := unstructured.NestedSlice(container, "env")
				newEnv := map[string]interface{}{
					"name":  "DISABLE_TELEMETRY",
					"value": "true",
				}
				env = append(env, newEnv)
				err := unstructured.SetNestedSlice(container, env, "env")
				if err != nil {
					log.Fatal(err)
				}
				containers[0] = container
				err = unstructured.SetNestedSlice(obj.Object, containers, "spec", "template", "spec", "containers")
				if err != nil {
					log.Fatal(err)
				}
				fmt.Println("telemetry is disabled")
			}
		}

		err = doServerSideApply(context.TODO(), config, obj)
		if err != nil {
			return err
		}
	}

	return nil
}

var applyCmd = &cobra.Command{
	Use:   "init",
	Short: "initialize cyclops with all the resources (along with demo templates)",
	Run: func(cmd *cobra.Command, args []string) {
		version, err := cmd.Flags().GetString("version")
		if err != nil {
			log.Fatal(err)
		}

		disableTelemetry, err := cmd.Flags().GetBool("disable-telemetry")
		if err != nil {
			log.Fatal(err)
		}

		var deployUrl string
		var demoUrl string

		if version != "main" {
			deployUrl = "https://raw.githubusercontent.com/cyclops-ui/cyclops/v" + version + "/install/cyclops-install.yaml"
			demoUrl = "https://raw.githubusercontent.com/cyclops-ui/cyclops/v" + version + "/install/demo-templates.yaml"
		} else {
			deployUrl = "https://raw.githubusercontent.com/cyclops-ui/cyclops/" + version + "/install/cyclops-install.yaml"
			demoUrl = "https://raw.githubusercontent.com/cyclops-ui/cyclops/" + version + "/install/demo-templates.yaml"
		}

		fmt.Println("using version:", version)

		fmt.Println("fetching cyclops manifest")
		deploy, err := http.Get(deployUrl)
		if err != nil {
			log.Fatal(err)
		}

		defer deploy.Body.Close()

		deployYamlFile, err := ioutil.ReadAll(deploy.Body)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println("initializing cyclops resources")

		err = applyYaml(deployYamlFile, kubeconfig.Config, disableTelemetry)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println("initialization successful")

		fmt.Println("fetching demo templates manifest")
		demo, err := http.Get(demoUrl)
		if err != nil {
			log.Fatal(err)
		}

		defer demo.Body.Close()

		demoYamlFile, err := ioutil.ReadAll(demo.Body)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println("creating demo templates")
		err = applyYaml(demoYamlFile, kubeconfig.Config, disableTelemetry)
		if err != nil {
			log.Fatal(err)
		}
	},
}

func init() {
	applyCmd.Flags().StringP("version", "v", "main", "specify cyclops version")
	applyCmd.Flags().BoolP("disable-telemetry", "t", false, "disable emitting telemetry metrics from cyclops controller")
	RootCmd.AddCommand(applyCmd)
}

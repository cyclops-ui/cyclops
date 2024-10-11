package create

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/manifoldco/promptui"
	"github.com/spf13/cobra"
	v1Spec "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/yaml"
)

var (
	createTemplateAuthRuleExample = `# Create templateauth rule
cyctl create templateauthrule NAME --repo='github.com/repo/a' --username='name:key' --password='name:key'

# Create templateauthrule
cyctl create templateauthrule demo-templateauthrule --repo='https://github.com/cyclops-ui/templates' --username='name:john' --password='name:random'`
)

var (
	username     string
	password     string
	usernameName string
	passwordName string
	usernameKey  string
	passwordKey  string
)

func getTeamplateAuthRulesFromPromt() (string, string, string, string, string, error) {
	RepoPrompt := promptui.Prompt{
		Label: "repo",
	}
	repoValue, err := RepoPrompt.Run()
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("Prompt failed: %v", err)
	}
	usernameNamePrompt := promptui.Prompt{
		Label: "Username secret name",
		Validate: func(input string) error {
			if input == "" {
				return errors.New("The username Name cannot be empty")
			}
			return nil
		},
	}
	usernameName, err := usernameNamePrompt.Run()
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("Prompt failed: %v", err)
	}

	usernameKeyPrompt := promptui.Prompt{
		Label: "Username: Key",
		Validate: func(input string) error {
			if input == "" {
				return errors.New("The username key cannot be empty")
			}
			return nil
		},
	}
	usernameKey, err := usernameKeyPrompt.Run()
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("Prompt failed: %v", err)
	}

	passwordNamePrompt := promptui.Prompt{
		Label: "Password secret name",
		Validate: func(input string) error {
			if input == "" {
				return errors.New("The password name cannot be empty")
			}
			return nil
		},
	}
	passwordName, err := passwordNamePrompt.Run()
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("Prompt failed: %v", err)
	}

	passwordKeyPrompt := promptui.Prompt{
		Label: "Password: Key",
		Validate: func(input string) error {
			if input == "" {
				return errors.New("The password key cannot be empty")
			}
			return nil
		},
	}
	passwordKey, err := passwordKeyPrompt.Run()
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("Prompt failed: %v", err)
	}

	return usernameName, usernameKey, passwordName, passwordKey, repoValue, nil

}

func validateSecretKeySelector(username, password string) (string, string, string, string, error) {
	usernameName, usernameKey := splitNameKey(username)
	passwordName, passwordKey := splitNameKey(password)

	// Ensure both name and key are present
	if usernameName == "" || usernameKey == "" || passwordName == "" || passwordKey == "" {

		return "", "", "", "", fmt.Errorf("invalid format for username or password. Expected 'name:key'")
	}

	return usernameName, usernameKey, passwordName, passwordKey, nil
}

func splitNameKey(input string) (string, string) {
	parts := strings.SplitN(input, ":", 2)
	if len(parts) < 2 {
		return "", ""
	}
	return parts[0], parts[1]
}

// createTemplateAuthRule allows you to create TemplateAuthRule Custom Resource.
func createTemplateAuthRule(clientset *client.CyclopsV1Alpha1Client, templateAuthRuleName string) {
	if username == "" && password == "" && repo == "" {
		var err error
		usernameName, usernameKey, passwordName, passwordKey, repo, err = getTeamplateAuthRulesFromPromt()
		if err != nil {
			fmt.Println(err)
			return
		}
	} else {
		var err error
		usernameName, usernameKey, passwordName, passwordKey, err = validateSecretKeySelector(username, password)
		if err != nil {
			fmt.Println(err)
			return
		}
	}

	var localObjectNameRef, localObjectPasswordRef v1Spec.LocalObjectReference
	if usernameName != "" {
		localObjectNameRef = v1Spec.LocalObjectReference{
			Name: usernameName,
		}
	}
	if passwordName != "" {
		localObjectPasswordRef = v1Spec.LocalObjectReference{
			Name: passwordName,
		}
	}

	newTemplateAuthRule := v1alpha1.TemplateAuthRule{
		TypeMeta: v1.TypeMeta{
			APIVersion: "cyclops-ui.com/v1alpha1",
			Kind:       "TemplateAuthRule",
		},
		ObjectMeta: v1.ObjectMeta{
			Name:      templateAuthRuleName,
			Namespace: namespace,
		},
		Spec: v1alpha1.TemplateAuthRuleSpec{
			Repo: repo,
			Username: v1Spec.SecretKeySelector{
				Key:                  usernameKey,
				LocalObjectReference: localObjectNameRef,
			},
			Password: v1Spec.SecretKeySelector{
				Key:                  passwordKey,
				LocalObjectReference: localObjectPasswordRef,
			},
		},
	}

	if outputFormat == "yaml" {
		// Marshal the newTemplateAuthRule object to JSON
		jsonOutput, err := json.Marshal(newTemplateAuthRule)
		if err != nil {
			log.Fatalf("Error marshalling templateauthrule to JSON: %v", err)
		}
		// Convert JSON to YAML
		yamlOutput, err := yaml.JSONToYAML(jsonOutput)
		if err != nil {
			log.Fatalf("Error converting templateauthrule to YAML: %v", err)
		}
		fmt.Printf("---\n%s\n", yamlOutput)
	} else if outputFormat == "json" {
		output, err := json.MarshalIndent(newTemplateAuthRule, "", "  ")
		if err != nil {
			log.Fatalf("Error converting templateauthrule to JSON: %v", err)
		}
		fmt.Printf("%s\n", output)
	} else if outputFormat == "" {
		// Proceed with creation if no output format is specified
		templateAuthRule, err := clientset.TemplateAuthRules(namespace).Create(&newTemplateAuthRule)
		if err != nil {
			fmt.Printf("Error creating templateauthrule: %v\n", err)
			return
		}
		fmt.Printf("%v created successfully.\n", templateAuthRule.Name)
	} else {
		log.Fatalf("Invalid output format: %s. Supported formats are 'yaml' and 'json'.", outputFormat)
	}
}

var (
	CreateTemplateAuthRule = &cobra.Command{
		Use:     "templateauthrules NAME --username='name:key' --password='name:key'",
		Short:   "Create templateauthrules",
		Long:    "The create templateauthrules command allows you to create templateauthrules from the Cyclops API.",
		Example: createTemplateAuthRuleExample,
		Args:    cobra.ExactArgs(1),
		Aliases: []string{"templateauthrule"},
		Run: func(cmd *cobra.Command, args []string) {
			createTemplateAuthRule(kubeconfig.Moduleset, args[0])
		},
	}
)

func init() {
	CreateTemplateAuthRule.Flags().StringVarP(&repo, "repo", "r", "", "Repository URL of the template")
	CreateTemplateAuthRule.Flags().StringVarP(&username, "username", "u", "", "Username in the format 'name:key'")
	CreateTemplateAuthRule.Flags().StringVarP(&password, "password", "p", "", "Password in the format 'name:key'")
	CreateTemplateAuthRule.Flags().StringVarP(&namespace, "namespace", "n", "cyclops", "Namespace where the templateauthrule will be created")
	CreateTemplateAuthRule.Flags().StringVarP(&outputFormat, "output", "o", "", "Output format (yaml or json)")
}

package create

import (
	"fmt"
	"strings"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	v1Spec "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var (
	createTemplateAuthRuleExample = ` 
	# Create templateauth rule
	cyctl create templateauthrule NAME --repo='github.com/repo/a' --username='name:key' --password='name:key'
 
	# Create templateauthrule
	cyctl create templateauthrule demo-templateauthrule --repo='https://github.com/cyclops-ui/templates' --username='name:john' --password='name:random'`
)

var (
	username string
	password string
)

func validateSecretKeySelector(username, password string) (string, string, string, string, error) {
	usernameName, usernameKey := _splitNameKey(username)
	passwordName, passwordKey := _splitNameKey(password)

	// Ensure both name and key are present
	if usernameName == "" || usernameKey == "" || passwordName == "" || passwordKey == "" {
		return "", "", "", "", fmt.Errorf("invalid format for username or password. Expected 'name:key'")
	}

	return usernameName, usernameKey, passwordName, passwordKey, nil
}

func _splitNameKey(input string) (string, string) {
	parts := strings.SplitN(input, ":", 2)
	if len(parts) < 2 {
		return "", ""
	}
	return parts[0], parts[1]
}

// createTemplateAuthRule allows you to create create TemplateAuthRule Custom Resource.
func createTemplateAuthRule(clientset *client.CyclopsV1Alpha1Client, templateAuthRuleName string) {
	usernameName, usernameKey, passwordName, passwordKey, err := validateSecretKeySelector(username, password)
	if err != nil {
		fmt.Println(err)
		return
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

	templateAuthRule, err := clientset.TemplateAuthRules(namespace).Create(&newTemplateAuthRule)
	if err != nil {
		fmt.Printf("Error creating templateauthrule: %v\n", err)
		return
	}
	fmt.Printf("%v created successfully.\n", templateAuthRule.Name)

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
}

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

// createTemplateAuthRule allows you to create create TemplateAuthRule Custom Resource.
func createTemplateAuthRule(clientset *client.CyclopsV1Alpha1Client, templateAuthRuleName string) {
	usernameSlice := strings.Split(username, ":")
	passwordSlice := strings.Split(password, ":")

	// Ensure key is present for both username and password
	if len(usernameSlice) < 2 || usernameSlice[1] == "" || len(passwordSlice) < 2 || passwordSlice[1] == "" {
		fmt.Printf("Invalid format for username or password. Expected 'name:key'.\n")
		return
	}

	usernameKey, passwordKey := usernameSlice[1], passwordSlice[1]
	var usernameName, passwordName string
	if len(usernameSlice) > 1 {
		usernameName = usernameSlice[0]
	}
	if len(passwordSlice) > 1 {
		passwordName = passwordSlice[0]
	}

	if usernameName == "" || passwordName == "" {
		fmt.Printf("Invalid format for username or password. Both name and key are required.\n")
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

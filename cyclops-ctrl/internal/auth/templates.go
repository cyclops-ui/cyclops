package auth

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/types"
	"regexp"
)

type TemplatesResolver struct {
	k8s k8sClient
}

type Credentials struct {
	Username string
	Password string
}

func NewTemplatesResolver(k8s k8sClient) TemplatesResolver {
	return TemplatesResolver{
		k8s: k8s,
	}
}

func (t TemplatesResolver) RepoAuthCredentials(repo string) (*Credentials, error) {
	tas, err := t.k8s.ListTemplateAuthRules()
	if err != nil {
		return nil, err
	}

	for _, ta := range tas {
		re, err := regexp.Compile(ta.Spec.Repo)
		if err != nil {
			continue
		}

		if re.MatchString(repo) {
			username, err := t.k8s.GetTemplateAuthRuleSecret(ta.Spec.Username.Name, ta.Spec.Username.Key)
			if err != nil {
				return nil, err
			}

			password, err := t.k8s.GetTemplateAuthRuleSecret(ta.Spec.Password.Name, ta.Spec.Password.Key)
			if err != nil {
				return nil, err
			}

			return &Credentials{
				Username: username,
				Password: password,
			}, err
		}
	}

	return nil, nil
}

type k8sClient interface {
	GetTemplateAuthRuleSecret(string, string) (string, error)
	ListTemplateAuthRules() ([]types.TemplateAuthRule, error)
}

package git

import (
	"bytes"
	"errors"
	"fmt"
	json "github.com/json-iterator/go"
	path2 "path"
	"text/template"
	"time"

	"github.com/go-logr/logr"

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/go-git/go-git/v5/storage/memory"
	"sigs.k8s.io/yaml"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/auth"
)

type WriteClient struct {
	templatesResolver     auth.TemplatesResolver
	commitMessageTemplate *template.Template
}

const _defaultCommitMessageTemplate = "Update {{ .Name }} module config"

func NewWriteClient(templatesResolver auth.TemplatesResolver, commitMessageTemplate string, logger logr.Logger) *WriteClient {
	return &WriteClient{
		templatesResolver:     templatesResolver,
		commitMessageTemplate: getCommitMessageTemplate(commitMessageTemplate, logger),
	}
}

func getCommitMessageTemplate(commitMessageTemplate string, logger logr.Logger) *template.Template {
	if commitMessageTemplate == "" {
		return template.Must(template.New("commitMessage").Parse(_defaultCommitMessageTemplate))
	}

	tmpl, err := template.New("commitMessage").Parse(commitMessageTemplate)
	if err != nil {
		logger.Error(err, "failed to parse commit message template, falling back to the default commit message", "template", commitMessageTemplate)
		return template.Must(template.New("commitMessage").Parse(_defaultCommitMessageTemplate))
	}

	return tmpl
}

func getModulePath(module cyclopsv1alpha1.Module) (string, error) {
	path := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWritePathAnnotation]

	tmpl, err := template.New("modulePath").Parse(path)
	if err != nil {
		return "", err
	}

	moduleMap := make(map[string]interface{})
	moduleData, err := json.Marshal(module)
	if err != nil {
		return "", err
	}
	if err := json.Unmarshal(moduleData, &moduleMap); err != nil {
		return "", err
	}

	var o bytes.Buffer
	err = tmpl.Execute(&o, moduleMap)
	if err != nil {
		return "", err
	}

	return o.String(), nil
}

func (c *WriteClient) Write(module cyclopsv1alpha1.Module) error {
	module.Status.ReconciliationStatus = nil
	module.Status.ManagedGVRs = nil

	repoURL, exists := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRepoAnnotation]
	if !exists {
		return errors.New(fmt.Sprintf("module passed to write without git repository; set cyclops-ui.com/write-repo annotation in module %v", module.Name))
	}

	path, err := getModulePath(module)
	if err != nil {
		return err
	}

	revision := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRevisionAnnotation]

	creds, err := c.templatesResolver.RepoAuthCredentials(repoURL)
	if err != nil {
		return err
	}

	storer := memory.NewStorage()
	fs := memfs.New()

	repo, worktree, err := cloneRepo(repoURL, revision, storer, &fs, creds)
	if err != nil {
		if errors.Is(err, git.NoMatchingRefSpecError{}) {
			storer = memory.NewStorage()
			fs = memfs.New()
			repo, worktree, err = cloneRepo(repoURL, "", storer, &fs, creds)
			if err != nil {
				return err
			}

			err = worktree.Checkout(&git.CheckoutOptions{
				Branch: plumbing.NewBranchReferenceName(revision),
				Create: true,
			})
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}

	path = moduleFilePath(path, module.Name)

	file, err := fs.Create(path)
	if err != nil {
		return fmt.Errorf("failed to create file in repository: %w", err)
	}

	moduleData, err := yaml.Marshal(module)
	if err != nil {
		return err
	}

	if _, err := file.Write(moduleData); err != nil {
		return fmt.Errorf("failed to write JSON data to file: %w", err)
	}
	file.Close()

	if _, err := worktree.Add(path); err != nil {
		fmt.Println("err worktree.Add", path)
		return fmt.Errorf("failed to add file to worktree: %w", err)
	}

	var o bytes.Buffer
	err = c.commitMessageTemplate.Execute(&o, module.ObjectMeta)
	if err != nil {
		return err
	}

	_, err = worktree.Commit(o.String(), &git.CommitOptions{
		Author: &object.Signature{
			Name: creds.Username,
			When: time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to commit changes: %w", err)
	}

	if err := repo.Push(&git.PushOptions{
		Auth: httpBasicAuthCredentials(creds),
	}); err != nil {
		return fmt.Errorf("failed to push changes: %w", err)
	}

	return nil
}

func (c *WriteClient) DeleteModule(module cyclopsv1alpha1.Module) error {
	repoURL, exists := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRepoAnnotation]
	if !exists {
		return errors.New(fmt.Sprintf("module passed to delete without git repository; set cyclops-ui.com/write-repo annotation in module %v", module.Name))
	}

	path := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWritePathAnnotation]
	revision := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRevisionAnnotation]

	creds, err := c.templatesResolver.RepoAuthCredentials(repoURL)
	if err != nil {
		return err
	}

	storer := memory.NewStorage()
	fs := memfs.New()

	repo, worktree, err := cloneRepo(repoURL, revision, storer, &fs, creds)
	if err != nil {
		if errors.Is(err, git.NoMatchingRefSpecError{}) {
			storer = memory.NewStorage()
			fs = memfs.New()
			repo, worktree, err = cloneRepo(repoURL, "", storer, &fs, creds)
			if err != nil {
				return err
			}

			err = worktree.Checkout(&git.CheckoutOptions{
				Branch: plumbing.NewBranchReferenceName(revision),
				Create: true,
			})
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}

	path = moduleFilePath(path, module.Name)

	err = fs.Remove(path)
	if err != nil {
		return fmt.Errorf("failed to remove file from repository: %w", err)
	}

	if _, err := worktree.Add(path); err != nil {
		return fmt.Errorf("failed to add changes to worktree: %w", err)
	}

	var o bytes.Buffer
	err = c.commitMessageTemplate.Execute(&o, module.ObjectMeta)
	if err != nil {
		return err
	}

	_, err = worktree.Commit(o.String(), &git.CommitOptions{
		Author: &object.Signature{
			Name: creds.Username,
			When: time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to commit changes: %w", err)
	}

	if err := repo.Push(&git.PushOptions{
		Auth: httpBasicAuthCredentials(creds),
	}); err != nil {
		return fmt.Errorf("failed to push changes: %w", err)
	}

	return nil
}

func moduleFilePath(path, moduleName string) string {
	if path2.Ext(path) != "yaml" || path2.Ext(path) != "yml" {
		path = path2.Join(path, fmt.Sprintf("%v.yaml", moduleName))
	}

	return path
}

func cloneRepo(url, revision string, storer *memory.Storage, fs *billy.Filesystem, creds *auth.Credentials) (*git.Repository, *git.Worktree, error) {
	cloneOpts := git.CloneOptions{
		URL:          url,
		Auth:         httpBasicAuthCredentials(creds),
		SingleBranch: true,
	}

	if len(revision) != 0 {
		cloneOpts.ReferenceName = plumbing.NewBranchReferenceName(revision)
	}

	repo, err := git.Clone(storer, *fs, &cloneOpts)
	if err != nil {
		return nil, nil, err
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return nil, nil, err
	}

	return repo, worktree, nil
}

func httpBasicAuthCredentials(creds *auth.Credentials) *http.BasicAuth {
	if creds == nil {
		return nil
	}

	return &http.BasicAuth{
		Username: creds.Username,
		Password: creds.Password,
	}
}

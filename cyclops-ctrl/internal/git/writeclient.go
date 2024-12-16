package git

import (
	"errors"
	"fmt"
	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/auth"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/go-git/go-git/v5/storage/memory"
	path2 "path"
	"sigs.k8s.io/yaml"
	"time"
)

type WriteClient struct {
	templatesResolver auth.TemplatesResolver
}

func NewWriteClient(templatesResolver auth.TemplatesResolver) *WriteClient {
	return &WriteClient{
		templatesResolver: templatesResolver,
	}
}

func (c *WriteClient) Write(module cyclopsv1alpha1.Module) error {
	module.Status = nil

	repoURL, exists := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRepoAnnotation]
	if !exists {
		return errors.New(fmt.Sprintf("module passed to write without git repository; set cyclops-ui.com/write-repo annotation in module %v", module.Name))
	}

	path := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWritePathAnnotation]
	revision := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRevisionAnnotation]

	creds, err := c.templatesResolver.RepoAuthCredentials(repoURL)
	if err != nil {
		return err
	}

	storer := memory.NewStorage()
	fs := memfs.New()
	repo, err := git.Clone(storer, fs, &git.CloneOptions{
		URL:  repoURL,
		Auth: httpBasicAuthCredentials(creds),
	})
	if err != nil {
		return fmt.Errorf("failed to clone repository: %w", err)
	}

	if path2.Ext(path) != "yaml" || path2.Ext(path) != "yml" {
		path = path2.Join(path, fmt.Sprintf("%v.yaml", module.Name))
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	if len(revision) != 0 {
		branch := plumbing.NewBranchReferenceName(revision)
		err = worktree.Checkout(&git.CheckoutOptions{
			Branch: branch,
			Create: false,
		})
		if err != nil {
			if errors.Is(err, plumbing.ErrReferenceNotFound) {
				err = worktree.Checkout(&git.CheckoutOptions{
					Branch: branch,
					Create: true,
				})
			} else {
				return fmt.Errorf("failed to checkout branch %s: %w", branch.String(), err)
			}

			err = worktree.Pull(&git.PullOptions{
				Auth:          httpBasicAuthCredentials(creds),
				ReferenceName: branch,
				RemoteName:    "origin",
				SingleBranch:  true,
			})
			if err != nil && !errors.Is(err, git.NoErrAlreadyUpToDate) {
				return fmt.Errorf("failed to pull changes: %w", err)
			}
		}
	}

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

	commitMessage := fmt.Sprintf("Update %s with new module data", path)
	_, err = worktree.Commit(commitMessage, &git.CommitOptions{
		Author: &object.Signature{
			Name: "Cyclops UI",
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

func httpBasicAuthCredentials(creds *auth.Credentials) *http.BasicAuth {
	if creds == nil {
		return nil
	}

	return &http.BasicAuth{
		Username: creds.Username,
		Password: creds.Password,
	}
}

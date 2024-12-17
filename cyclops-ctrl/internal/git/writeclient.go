package git

import (
	"errors"
	"fmt"
	path2 "path"
	"time"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/auth"
	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/go-git/go-git/v5/storage/memory"
	"sigs.k8s.io/yaml"
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
	module.Status = cyclopsv1alpha1.ModuleStatus{}

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

	if path2.Ext(path) != "yaml" || path2.Ext(path) != "yml" {
		path = path2.Join(path, fmt.Sprintf("%v.yaml", module.Name))
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

package template

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	path2 "path"
	"path/filepath"
	"strings"

	"github.com/pkg/errors"
	"gopkg.in/yaml.v2"

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/protocol/packp/capability"
	"github.com/go-git/go-git/v5/plumbing/transport"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/go-git/go-git/v5/storage/memory"
	"helm.sh/helm/v3/pkg/chart"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/auth"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/template/gitproviders"
)

func (r Repo) LoadTemplate(repoURL, path, commit, resolvedVersion string) (*models.Template, error) {
	creds, err := r.credResolver.RepoAuthCredentials(repoURL)
	if err != nil {
		return nil, err
	}

	commitSHA := resolvedVersion
	if len(commitSHA) == 0 {
		ref, err := resolveRef(repoURL, commit, creds)
		if err != nil {
			return nil, err
		}

		commitSHA = ref
	}

	cached, ok := r.cache.GetTemplate(repoURL, path, commitSHA, string(cyclopsv1alpha1.TemplateSourceTypeGit))
	if ok {
		return cached, nil
	}

	if gitproviders.IsGitHubSource(repoURL) {
		ghTemplate, err := r.mapGitHubRepoTemplate(repoURL, path, commitSHA, creds)
		if err != nil {
			return nil, err
		}

		ghTemplate.Version = commit
		ghTemplate.ResolvedVersion = commitSHA

		r.cache.SetTemplate(repoURL, path, commitSHA, string(cyclopsv1alpha1.TemplateSourceTypeGit), ghTemplate)

		return ghTemplate, nil
	}

	fs, err := clone(repoURL, commit, creds)
	if err != nil {
		return nil, err
	}

	// region read files
	filesFs, err := fs.Chroot(path)
	if err != nil {
		return nil, errors.Wrap(err, "could not find 'templates' dir; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	files, err := readFiles("", filesFs)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read template files")
	}
	// endregion

	if len(files) == 0 {
		return nil, errors.Errorf("no files found in repo %v on path %v; make sure the repo, path and version are correct", repoURL, path)
	}

	// region map files to template
	metadataBytes := []byte{}
	schemaBytes := []byte{}
	chartFiles := make([]*chart.File, 0)

	templateFiles := make([]*chart.File, 0)
	crdFiles := make([]*chart.File, 0)

	dependenciesFromChartsDir := make(map[string]map[string][]byte, 0)

	for _, f := range files {
		parts := strings.Split(f.Name, "/")

		if len(parts) == 1 && parts[0] == "Chart.yaml" {
			metadataBytes = f.Data
			continue
		}

		if len(parts) == 1 && parts[0] == "values.schema.json" {
			schemaBytes = f.Data
			continue
		}

		if len(parts) > 1 && parts[0] == "templates" &&
			(parts[1] != "Notes.txt" && parts[1] != "NOTES.txt" && parts[1] != "tests") {
			templateFiles = append(templateFiles, f)
			continue
		}

		if len(parts) > 1 && parts[0] == "crds" &&
			(parts[1] != "Notes.txt" && parts[1] != "NOTES.txt" && parts[1] != "tests") {
			crdFiles = append(crdFiles, f)
			continue
		}

		if len(parts) > 2 && parts[0] == "charts" {
			depName := parts[1]
			if _, ok := dependenciesFromChartsDir[depName]; !ok {
				dependenciesFromChartsDir[depName] = make(map[string][]byte)
			}

			dependenciesFromChartsDir[depName][path2.Join(parts[1:]...)] = f.Data
			continue
		}

		chartFiles = append(chartFiles, f)
	}

	var schema helm.Property
	// unmarshal values schema only if present
	if len(schemaBytes) > 0 {
		if err := json.Unmarshal(schemaBytes, &schema); err != nil {
			fmt.Println("error on schema bytes", repoURL, path)
			return &models.Template{}, err
		}
	}

	var metadata *helm.Metadata
	if err := yaml.Unmarshal(metadataBytes, &metadata); err != nil {
		fmt.Println("error on meta unmarshal", repoURL, path)
		return &models.Template{}, err
	}

	// region load dependencies
	dependencies, err := r.loadDependencies(metadata)
	if err != nil {
		return &models.Template{}, err
	}

	for depName, files := range dependenciesFromChartsDir {
		if dependencyExists(depName, dependencies) {
			continue
		}

		dep, err := r.mapHelmChart(depName, files)
		if err != nil {
			return nil, err
		}

		dependencies = append(dependencies, dep)
	}
	// endregion

	template := &models.Template{
		Name:              path,
		ResolvedVersion:   commitSHA,
		Version:           commit,
		RootField:         mapper.HelmSchemaToFields("", schema, schema.Definitions, dependencies),
		Files:             chartFiles,
		Templates:         templateFiles,
		CRDs:              crdFiles,
		Dependencies:      dependencies,
		HelmChartMetadata: metadata,
		RawSchema:         schemaBytes,
		IconURL:           metadata.Icon,
	}
	// endregion

	r.cache.SetTemplate(repoURL, path, commitSHA, string(cyclopsv1alpha1.TemplateSourceTypeGit), template)

	return template, err
}

func (r Repo) LoadInitialTemplateValues(repoURL, path, commit string) (map[string]interface{}, error) {
	creds, err := r.credResolver.RepoAuthCredentials(repoURL)
	if err != nil {
		return nil, err
	}

	commitSHA, err := resolveRef(repoURL, commit, creds)
	if err != nil {
		return nil, err
	}

	cached, ok := r.cache.GetTemplateInitialValues(repoURL, path, commitSHA, string(cyclopsv1alpha1.TemplateSourceTypeGit))
	if ok {
		return cached, nil
	}

	if gitproviders.IsGitHubSource(repoURL) {
		ghInitialValues, err := r.mapGitHubRepoInitialValues(repoURL, path, commitSHA, creds)
		if err != nil {
			return nil, err
		}

		r.cache.SetTemplateInitialValues(repoURL, path, commitSHA, string(cyclopsv1alpha1.TemplateSourceTypeGit), ghInitialValues)

		return ghInitialValues, nil
	}

	fs, err := clone(repoURL, commit, creds)
	if err != nil {
		return nil, err
	}

	// load helm chart metadata
	chartMetadata, err := fs.Open(path2.Join(path, "Chart.yaml"))
	if err != nil {
		return nil, errors.Wrap(err, "could not read 'Chart.yaml' file; it should be placed in the repo/path you provided; make sure you provided the correct path")
	}

	var chartMetadataBuffer bytes.Buffer
	_, err = io.Copy(bufio.NewWriter(&chartMetadataBuffer), chartMetadata)
	if err != nil {
		return nil, err
	}

	var metadata *helm.Metadata
	if err := yaml.Unmarshal(chartMetadataBuffer.Bytes(), &metadata); err != nil {
		return nil, err
	}
	// endregion

	// region read values
	data, err := readValuesFile(fs, path)
	if err != nil {
		return nil, err
	}

	var initialValues map[string]interface{}
	if err := yaml.Unmarshal(data, &initialValues); err != nil {
		return nil, err
	}
	// endregion

	// region read dependency values
	if initialValues == nil {
		initialValues = make(map[string]interface{})
	}

	depInitialValues, err := r.loadDependenciesInitialValues(metadata)
	if err != nil {
		return nil, err
	}

	for key, values := range depInitialValues {
		initialValues[key] = values
	}
	// endregion

	r.cache.SetTemplateInitialValues(repoURL, path, commitSHA, string(cyclopsv1alpha1.TemplateSourceTypeGit), initialValues)

	return initialValues, nil
}

func resolveRef(repo, version string, creds *auth.Credentials) (string, error) {
	if len(version) == 0 {
		return resolveDefaultBranchRef(repo, creds)
	}

	rem := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{repo},
	})

	// We can then use every Remote functions to retrieve wanted information
	refs, err := rem.List(&git.ListOptions{
		PeelingOption: git.AppendPeeled,
		Auth:          httpBasicAuthCredentials(creds),
	})
	if err != nil {
		return "", errors.Wrap(err, fmt.Sprintf("repo %s was not cloned successfully; authentication might be required; check if repository exists and you referenced it correctly", repo))
	}

	// Filters the references list and only keeps tags
	for _, ref := range refs {
		if ref.Name().Short() == version {
			return ref.Hash().String(), nil
		}
	}

	return version, nil
}

func resolveDefaultBranchRef(repo string, creds *auth.Credentials) (string, error) {
	rem := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{repo},
	})

	// We can then use every Remote functions to retrieve wanted information
	refs, err := rem.List(&git.ListOptions{
		PeelingOption: git.AppendPeeled,
		Auth:          httpBasicAuthCredentials(creds),
	})
	if err != nil {
		return "", errors.Wrap(err, fmt.Sprintf("repo %s was not cloned successfully; authentication might be required; check if repository exists and you referenced it correctly", repo))
	}

	// Filters the references list and only keeps tags
	for _, r := range refs {
		if r.Name().Short() == plumbing.HEAD.Short() {
			for _, rr := range refs {
				if rr.Name().String() == r.Target().String() {
					return rr.Hash().String(), nil
				}
			}
		}
	}

	return "", errors.New("failed resolving HEAD ref")
}

func readValuesFile(fs billy.Filesystem, path string) ([]byte, error) {
	valuesFile, err := fs.Open(path2.Join(path, "values.yaml"))
	if err != nil {
		if err.Error() == "file does not exist" {
			return []byte(""), nil
		}

		return nil, err
	}

	var c bytes.Buffer
	_, err = io.Copy(bufio.NewWriter(&c), valuesFile)
	if err != nil {
		return nil, err
	}

	return c.Bytes(), nil
}

func clone(repoURL, commit string, creds *auth.Credentials) (billy.Filesystem, error) {
	// region clone from git
	if gitproviders.IsAzureRepo(repoURL) {
		transport.UnsupportedCapabilities = []capability.Capability{
			capability.ThinPack,
		}
	}

	repo, err := git.Clone(memory.NewStorage(), memfs.New(), &git.CloneOptions{
		URL:  repoURL,
		Tags: git.AllTags,
		Auth: httpBasicAuthCredentials(creds),
	})
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("repo %s was not cloned successfully; authentication might be required; check if repository exists and you referenced it correctly", repoURL))
	}

	wt, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	if len(commit) != 0 {
		remoteName := "origin"
		branchPrefix := "refs/heads/"
		tagPrefix := "refs/tags/"
		remote, err := repo.Remote(remoteName)
		if err != nil {
			return nil, err
		}
		refList, err := remote.List(&git.ListOptions{
			Auth: httpBasicAuthCredentials(creds),
		})
		if err != nil {
			return nil, err
		}

		var reference *plumbing.Reference

		for _, ref := range refList {
			refName := ref.Name().String()
			if strings.HasPrefix(refName, branchPrefix) {
				branchName := refName[len(branchPrefix):]
				if branchName != commit {
					continue
				}

				refName := plumbing.NewRemoteReferenceName(remoteName, branchName)
				reference, err = repo.Reference(refName, true)
				if err != nil {
					return nil, err
				}
			} else if strings.HasPrefix(refName, tagPrefix) {
				tagName := refName[len(tagPrefix):]
				if tagName != commit {
					continue
				}

				reference, err = repo.Tag(tagName)
				if err != nil {
					return nil, err
				}
			}
		}

		if reference == nil {
			reference = plumbing.NewHashReference(plumbing.HEAD, plumbing.NewHash(commit))
		}

		err = wt.Checkout(&git.CheckoutOptions{
			Hash: reference.Hash(),
		})
		if err != nil {
			return nil, err
		}
	}

	return wt.Filesystem, nil
}

func concatenateTemplates(path string, fs billy.Filesystem) ([]string, error) {
	files, err := fs.ReadDir(path)
	if err != nil {
		return nil, err
	}

	manifests := make([]string, 0)

	for _, fileInfo := range files {
		if fileInfo.IsDir() {
			dirManifests, err := concatenateTemplates(path2.Join(path, fileInfo.Name()), fs)
			if err != nil {
				return nil, err
			}

			manifests = append(manifests, dirManifests...)
			continue
		}

		file, err := fs.Open(path2.Join(path, fileInfo.Name()))
		if err != nil {
			return nil, err
		}

		var b bytes.Buffer
		_, err = io.Copy(bufio.NewWriter(&b), file)
		if err != nil {
			return nil, err
		}

		manifests = append(manifests, b.String())
	}

	return manifests, nil
}

func readFiles(path string, fs billy.Filesystem) ([]*chart.File, error) {
	files, err := fs.ReadDir(path)
	if err != nil {
		return nil, err
	}

	chartFiles := make([]*chart.File, 0)

	for _, fileInfo := range files {
		if fileInfo.IsDir() {
			dirChartFiles, err := readFiles(path2.Join(path, fileInfo.Name()), fs)
			if err != nil {
				return nil, err
			}

			chartFiles = append(chartFiles, dirChartFiles...)
			continue
		}

		ext := filepath.Ext(fileInfo.Name())
		if ext == "yaml" {
			continue
		}

		file, err := fs.Open(path2.Join(path, fileInfo.Name()))
		if err != nil {
			return nil, err
		}

		var b bytes.Buffer
		_, err = io.Copy(bufio.NewWriter(&b), file)
		if err != nil {
			return nil, err
		}

		chartFiles = append(chartFiles, &chart.File{
			Name: path2.Join(path, fileInfo.Name()),
			Data: b.Bytes(),
		})
	}

	return chartFiles, nil
}

func (r Repo) mapGitHubRepoTemplate(repoURL, path, commitSHA string, creds *auth.Credentials) (*models.Template, error) {
	tgzData, err := gitproviders.GitHubClone(repoURL, commitSHA, creds)
	if err != nil {
		return nil, err
	}

	ghRepoFiles, err := unpackTgzInMemory(tgzData)
	if err != nil {
		return nil, err
	}

	ghRepoFiles, exists := gitproviders.SanitizeGHFiles(ghRepoFiles, path)
	if !exists {
		return nil, errors.Errorf("provided path %v for repo %v does not exist on version %v", path, repoURL, commitSHA)
	}

	template, err := r.mapHelmChart(path, ghRepoFiles)
	if err != nil {
		return nil, err
	}

	return template, nil
}

func (r Repo) mapGitHubRepoInitialValues(repoURL, path, commitSHA string, creds *auth.Credentials) (map[string]interface{}, error) {
	tgzData, err := gitproviders.GitHubClone(repoURL, commitSHA, creds)
	if err != nil {
		return nil, err
	}

	ghRepoFiles, err := unpackTgzInMemory(tgzData)
	if err != nil {
		return nil, err
	}

	ghRepoFiles, exists := gitproviders.SanitizeGHFiles(ghRepoFiles, path)
	if !exists {
		return nil, errors.Errorf("provided path %v for repo %v does not exist on version %v", path, repoURL, commitSHA)
	}

	initial, err := r.mapHelmChartInitialValues(ghRepoFiles)
	if err != nil {
		return nil, err
	}

	return initial, nil
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

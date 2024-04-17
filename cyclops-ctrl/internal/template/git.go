package template

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/cyclops-ui/cycops-ctrl/internal/template/gitproviders"
	"github.com/pkg/errors"
	"gopkg.in/yaml.v2"
	"io"
	path2 "path"
	"path/filepath"
	"strings"

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/go-git/go-git/v5/storage/memory"
	"helm.sh/helm/v3/pkg/chart"

	"github.com/cyclops-ui/cycops-ctrl/internal/auth"
	"github.com/cyclops-ui/cycops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
)

func (r Repo) LoadTemplate(repoURL, path, commit string) (*models.Template, error) {
	creds, err := r.credResolver.RepoAuthCredentials(repoURL)
	if err != nil {
		return nil, err
	}

	commitSHA, err := resolveRef(repoURL, commit, creds)
	if err != nil {
		return nil, err
	}

	cached, ok := r.cache.GetTemplate(repoURL, path, commitSHA)
	if ok {
		return cached, nil
	}

	if gitproviders.IsGitHubSource(repoURL) {
		tgzData, err := gitproviders.GitHubClone(repoURL, commitSHA, creds)
		if err != nil {
			return nil, err
		}

		ghRepoFiles, err := unpackTgzInMemory(tgzData)
		if err != nil {
			return nil, err
		}

		ghRepoFiles = gitproviders.SanitizeGHFiles(ghRepoFiles)

		//for s, _ := range ghRepoFiles {
		//	fmt.Println("prije", s)
		//}

		ghTemplate, err := r.mapHelmChart(path, ghRepoFiles)
		if err != nil {
			return nil, err
		}

		r.cache.SetTemplate(repoURL, path, commitSHA, ghTemplate)

		return ghTemplate, nil
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

	var metadata chart.Metadata
	if err := yaml.Unmarshal(chartMetadataBuffer.Bytes(), &metadata); err != nil {
		return nil, err
	}
	// endregion

	// region read templates
	templatesPath := path2.Join(path, "templates")

	_, err = fs.ReadDir(templatesPath)
	if err != nil {
		return nil, errors.Wrap(err, "could not find 'templates' dir; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	manifests, err := concatenateTemplates(templatesPath, fs)
	if err != nil {
		return nil, errors.Wrap(err, "failed to load template files")
	}
	// endregion

	// region read files
	filesFs, err := fs.Chroot(path)
	if err != nil {
		return nil, errors.Wrap(err, "could not find 'templates' dir; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	chartFiles, err := readFiles("", filesFs)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read template files")
	}
	// endregion

	// region read schema
	schemaFile, err := fs.Open(path2.Join(path, "values.schema.json"))
	if err != nil {
		return nil, errors.Wrap(err, "could not read 'values.schema.json' file; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	var schemaChartBuffer bytes.Buffer
	_, err = io.Copy(bufio.NewWriter(&schemaChartBuffer), schemaFile)
	if err != nil {
		return nil, err
	}

	var schema helm.Property
	if err := json.Unmarshal(schemaChartBuffer.Bytes(), &schema); err != nil {
		return nil, err
	}
	// endregion

	// region load dependencies
	dependencies, err := r.loadDependencies(metadata)
	if err != nil {
		return nil, err
	}
	// endregion

	template := &models.Template{
		Name:         "",
		Manifest:     strings.Join(manifests, "---\n"),
		RootField:    mapper.HelmSchemaToFields("", schema, dependencies),
		Created:      "",
		Edited:       "",
		Version:      "",
		Files:        chartFiles,
		Dependencies: dependencies,
	}

	r.cache.SetTemplate(repoURL, path, commitSHA, template)

	return template, err
}

func (r Repo) LoadInitialTemplateValues(repoURL, path, commit string) (map[interface{}]interface{}, error) {
	creds, err := r.credResolver.RepoAuthCredentials(repoURL)
	if err != nil {
		return nil, err
	}

	commitSHA, err := resolveRef(repoURL, commit, creds)
	if err != nil {
		return nil, err
	}

	cached, ok := r.cache.GetTemplateInitialValues(repoURL, path, commitSHA)
	if ok {
		return cached, nil
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

	var metadata chart.Metadata
	if err := yaml.Unmarshal(chartMetadataBuffer.Bytes(), &metadata); err != nil {
		return nil, err
	}
	// endregion

	// region read values
	data, err := readValuesFile(fs, path)
	if err != nil {
		return nil, err
	}

	var initialValues map[interface{}]interface{}
	if err := yaml.Unmarshal(data, &initialValues); err != nil {
		return nil, err
	}
	// endregion

	// region read dependency values
	if initialValues == nil {
		initialValues = make(map[interface{}]interface{})
	}

	depInitialValues, err := r.loadDependenciesInitialValues(metadata)
	if err != nil {
		return nil, err
	}

	for key, values := range depInitialValues {
		initialValues[key] = values
	}
	// endregion

	r.cache.SetTemplateInitialValues(repoURL, path, commitSHA, initialValues)

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
		return "", errors.Wrap(err, fmt.Sprintf("repo %s was not cloned sucessfully; authentication might be required; check if repository exists and you referenced it correctly", repo))
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
		return "", errors.Wrap(err, fmt.Sprintf("repo %s was not cloned sucessfully; authentication might be required; check if repository exists and you referenced it correctly", repo))
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
	repo, err := git.Clone(memory.NewStorage(), memfs.New(), &git.CloneOptions{
		URL:  repoURL,
		Tags: git.AllTags,
		Auth: httpBasicAuthCredentials(creds),
	})
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("repo %s was not cloned sucessfully; authentication might be required; check if repository exists and you referenced it correctly", repoURL))
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

func httpBasicAuthCredentials(creds *auth.Credentials) *http.BasicAuth {
	if creds == nil {
		return nil
	}

	return &http.BasicAuth{
		Username: creds.Username,
		Password: creds.Password,
	}
}

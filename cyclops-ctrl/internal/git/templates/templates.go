package git

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	path2 "path"
	"path/filepath"
	"strings"

	"github.com/cyclops-ui/cycops-ctrl/internal/helmclient"
	"github.com/cyclops-ui/cycops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
	"github.com/pkg/errors"
	"gopkg.in/src-d/go-billy.v4"
	"gopkg.in/src-d/go-billy.v4/memfs"
	git "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/plumbing"
	"gopkg.in/src-d/go-git.v4/storage/memory"
	"gopkg.in/yaml.v2"
	"helm.sh/helm/v3/pkg/chart"
)

func LoadTemplate(repoURL, path, commit string) (models.Template, error) {
	fs, err := clone(repoURL, commit)
	if err != nil {
		return models.Template{}, err
	}

	// load helm chart metadata
	chartMetadata, err := fs.Open(path2.Join(path, "Chart.yaml"))
	if err != nil {
		return models.Template{}, errors.Wrap(err, "could not read 'Chart.yaml' file; it should be placed in the repo/path you provided; make sure you provided the correct path")
	}

	var chartMetadataBuffer bytes.Buffer
	_, err = io.Copy(bufio.NewWriter(&chartMetadataBuffer), chartMetadata)
	if err != nil {
		return models.Template{}, err
	}

	var metadata chart.Metadata
	if err := yaml.Unmarshal(chartMetadataBuffer.Bytes(), &metadata); err != nil {
		return models.Template{}, err
	}
	// endregion

	// region read templates
	templatesPath := path2.Join(path, "templates")

	_, err = fs.ReadDir(templatesPath)
	if err != nil {
		return models.Template{}, errors.Wrap(err, "could not find 'templates' dir; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	manifests, err := concatenateTemplates(templatesPath, fs)
	if err != nil {
		return models.Template{}, errors.Wrap(err, "failed to load template files")
	}
	// endregion

	// region read files
	filesFs, err := fs.Chroot(path)
	if err != nil {
		return models.Template{}, errors.Wrap(err, "could not find 'templates' dir; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	chartFiles, err := readFiles("", filesFs)
	if err != nil {
		return models.Template{}, errors.Wrap(err, "failed to read template files")
	}
	// endregion

	// region read schema
	schemaFile, err := fs.Open(path2.Join(path, "values.schema.json"))
	if err != nil {
		return models.Template{}, errors.Wrap(err, "could not read 'values.schema.json' file; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	var schemaChartBuffer bytes.Buffer
	_, err = io.Copy(bufio.NewWriter(&schemaChartBuffer), schemaFile)
	if err != nil {
		return models.Template{}, err
	}

	var schema helm.Property
	if err := json.Unmarshal(schemaChartBuffer.Bytes(), &schema); err != nil {
		return models.Template{}, err
	}
	// endregion

	// region load dependencies
	dependencies, err := helmclient.LoadDependencies(metadata)
	if err != nil {
		return models.Template{}, err
	}
	// endregion

	return models.Template{
		Name:         "",
		Manifest:     strings.Join(manifests, "---\n"),
		Fields:       mapper.HelmSchemaToFields(schema, dependencies),
		Created:      "",
		Edited:       "",
		Version:      "",
		Files:        chartFiles,
		Dependencies: dependencies,
	}, nil
}

func LoadInitialTemplateValues(repoURL, path, commit string) (map[interface{}]interface{}, error) {
	fs, err := clone(repoURL, commit)
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

	depInitialValues, err := helmclient.LoadDependenciesInitialValues(metadata)
	if err != nil {
		return nil, err
	}

	for key, values := range depInitialValues {
		initialValues[key] = values
	}
	// endregion

	return initialValues, nil
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

func clone(repoURL, commit string) (billy.Filesystem, error) {
	// region clone from git
	repo, err := git.Clone(memory.NewStorage(), memfs.New(), &git.CloneOptions{
		URL:  repoURL,
		Tags: git.AllTags,
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
			panic(err)
		}
		refList, err := remote.List(&git.ListOptions{})
		if err != nil {
			panic(err)
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

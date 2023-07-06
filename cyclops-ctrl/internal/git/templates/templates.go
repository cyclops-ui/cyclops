package git

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	path2 "path"
	"strings"

	"github.com/cyclops-ui/cycops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
	"github.com/pkg/errors"
	"gopkg.in/src-d/go-billy.v4/memfs"
	git "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/storage/memory"
	"gopkg.in/yaml.v2"
)

func LoadTemplate(repoURL, path string) (models.Template, error) {
	repo, err := git.Clone(memory.NewStorage(), memfs.New(), &git.CloneOptions{
		URL: repoURL,
	})
	if err != nil {
		return models.Template{}, errors.Wrap(err, fmt.Sprintf("repo %s was not cloned sucessfully; authentication might be required; check if repository exists and you referenced it correctly", repoURL))
	}

	wt, err := repo.Worktree()
	if err != nil {
		return models.Template{}, err
	}

	fs := wt.Filesystem

	// check if helm chart
	_, err = fs.Open(path2.Join(path, "Chart.yaml"))
	if err != nil {
		return models.Template{}, errors.Wrap(err, "could not read 'Chart.yaml' file; it should be placed in the repo/path you provided; make sure you provided the correct path")
	}

	templatesPath := path2.Join(path, "templates")

	files, err := fs.ReadDir(templatesPath)
	if err != nil {
		return models.Template{}, errors.Wrap(err, "could not find 'templates' dir; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	manifests := make([]string, 0, len(files))

	for _, fileInfo := range files {
		if fileInfo.IsDir() {
			continue
		}

		file, err := fs.Open(path2.Join(templatesPath, fileInfo.Name()))
		if err != nil {
			return models.Template{}, err
		}

		var b bytes.Buffer
		_, err = io.Copy(bufio.NewWriter(&b), file)
		if err != nil {
			return models.Template{}, err
		}

		manifests = append(manifests, b.String())
	}

	// region read schema
	schemaFile, err := fs.Open(path2.Join(path, "values.schema.json"))
	if err != nil {
		return models.Template{}, errors.Wrap(err, "could not read 'values.schema.json' file; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	var b bytes.Buffer
	_, err = io.Copy(bufio.NewWriter(&b), schemaFile)
	if err != nil {
		return models.Template{}, err
	}

	var schema helm.Property
	if err := json.Unmarshal(b.Bytes(), &schema); err != nil {
		return models.Template{}, err
	}
	// endregion

	return models.Template{
		Name:     "",
		Manifest: strings.Join(manifests, "---\n"),
		Fields:   mapper.HelmSchemaToFields(schema),
		Created:  "",
		Edited:   "",
		Version:  "",
	}, nil
}

func LoadInitialTemplateValues(repoURL, path string) (map[string]interface{}, error) {
	repo, err := git.Clone(memory.NewStorage(), memfs.New(), &git.CloneOptions{
		URL: repoURL,
	})
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("repo %s was not cloned sucessfully; authentication might be required; check if repository exists and you referenced it correctly", repoURL))
	}

	wt, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	fs := wt.Filesystem

	// check if helm chart
	_, err = fs.Open(path2.Join(path, "Chart.yaml"))
	if err != nil {
		return nil, errors.Wrap(err, "could not read 'Chart.yaml' file; it should be placed in the repo/path you provided; make sure you provided the correct path")
	}

	templatesPath := path2.Join(path, "templates")

	files, err := fs.ReadDir(templatesPath)
	if err != nil {
		return nil, errors.Wrap(err, "could not find 'templates' dir; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	manifests := make([]string, 0, len(files))

	for _, fileInfo := range files {
		if fileInfo.IsDir() {
			continue
		}

		file, err := fs.Open(path2.Join(templatesPath, fileInfo.Name()))
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

	// region read values
	valuesFile, err := fs.Open(path2.Join(path, "values.yaml"))
	if err != nil {
		return nil, errors.Wrap(err, "could not read 'values.yaml' file; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	var c bytes.Buffer
	_, err = io.Copy(bufio.NewWriter(&c), valuesFile)
	if err != nil {
		return nil, err
	}

	var initialValues map[interface{}]interface{}
	if err := yaml.Unmarshal(c.Bytes(), &initialValues); err != nil {
		return nil, err
	}
	// endregion

	interfaceMap := flatten("", initialValues)
	out := make(map[string]interface{})
	for k, v := range interfaceMap {
		out[fmt.Sprintf("%v", k)] = v
	}

	return out, nil
}

func flatten(key string, value interface{}) map[interface{}]interface{} {
	switch value.(type) {
	case string:
		return map[interface{}]interface{}{
			"": value,
		}
	case int:
		return map[interface{}]interface{}{
			"": value,
		}
	case bool:
		return map[interface{}]interface{}{
			"": value,
		}
	case map[interface{}]interface{}:
		out := make(map[interface{}]interface{})

		cast := value.(map[interface{}]interface{})

		for k, v := range cast {
			t := flatten(fmt.Sprintf("%v", k), v)
			for tk, tv := range t {
				if len(fmt.Sprintf("%v", tk)) == 0 {
					out[fmt.Sprintf("%v", k)] = tv
				} else {
					out[strings.Join([]string{fmt.Sprintf("%v", k), fmt.Sprintf("%v", tk)}, ".")] = tv
				}
			}
		}

		return out
	}

	return map[interface{}]interface{}{}
}

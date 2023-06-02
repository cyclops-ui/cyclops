package git

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/cyclops-ui/cycops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
	"github.com/pkg/errors"
	"gopkg.in/src-d/go-billy.v4/memfs"
	git "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/storage/memory"
	"io"
	path2 "path"
	"strings"

	"github.com/cyclops-ui/cycops-ctrl/internal/models"
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

	// read schema
	schemaFile, err := fs.Open(path2.Join(path, "values.schema.json"))
	if err != nil {
		return models.Template{}, errors.Wrap(err, "could not read 'values.schema.json' file; it should be placed in the repo/path you provided; make sure 'templates' directory exists")
	}

	var b bytes.Buffer
	_, err = io.Copy(bufio.NewWriter(&b), schemaFile)
	if err != nil {
		return models.Template{}, err
	}

	var schema helm.Schema
	if err := json.Unmarshal(b.Bytes(), &schema); err != nil {
		return models.Template{}, err
	}

	return models.Template{
		Name:     "",
		Manifest: strings.Join(manifests, "---\n"),
		Fields:   mapper.HelmSchemaToFields(schema),
		Created:  "",
		Edited:   "",
		Version:  "",
	}, nil
}

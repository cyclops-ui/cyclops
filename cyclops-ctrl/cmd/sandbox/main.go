package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	path2 "path"
	"strings"

	"gopkg.in/src-d/go-billy.v4/memfs"
	git "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/storage/memory"

	"github.com/cyclops-ui/cycops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
)

func main() {
}

func loadFromGit(repoURL, path string) (models.Template, error) {
	repo, err := git.Clone(memory.NewStorage(), memfs.New(), &git.CloneOptions{
		URL: repoURL,
	})
	if err != nil {
		return models.Template{}, err
	}

	wt, err := repo.Worktree()
	if err != nil {
		return models.Template{}, err
	}

	fs := wt.Filesystem

	templatesPath := path2.Join(path, "templates")

	files, err := fs.ReadDir(templatesPath)
	if err != nil {
		return models.Template{}, err
	}

	manifests := make([]string, len(files))

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
		return models.Template{}, err
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
		Name:     path,
		Manifest: strings.Join(manifests, "---\n"),
		Fields:   mapper.HelmSchemaToFields(schema),
		Created:  "",
		Edited:   "",
		Version:  "HEAD",
	}, nil
}

package template

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"path"
	"strings"

	json "github.com/json-iterator/go"
	"gopkg.in/yaml.v2"
	helmchart "helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/registry"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
)

func (r Repo) LoadHelmChart(repo, chart, version string) (*models.Template, error) {
	var err error
	strictVersion := version
	if !isValidVersion(version) {
		if registry.IsOCI(repo) {
			strictVersion, err = getOCIStrictVersion(repo, chart, version)
			if err != nil {
				return nil, err
			}
		} else {
			strictVersion, err = getRepoStrictVersion(repo, chart, version)
			if err != nil {
				return nil, err
			}
		}
	}

	cached, ok := r.cache.GetTemplate(repo, chart, strictVersion)
	if ok {
		return cached, nil
	}

	var tgzData []byte
	if registry.IsOCI(repo) {
		tgzData, err = loadOCIHelmChartBytes(repo, chart, version)
		if err != nil {
			return nil, err
		}
	} else {
		tgzData, err = r.loadFromHelmChartRepo(repo, chart, version)
		if err != nil {
			return nil, err
		}
	}

	extractedFiles, err := unpackTgzInMemory(tgzData)
	if err != nil {
		return nil, err
	}

	template, err := r.mapHelmChart(chart, extractedFiles)
	if err != nil {
		return nil, err
	}

	template.Version = version
	template.ResolvedVersion = strictVersion

	r.cache.SetTemplate(repo, chart, strictVersion, template)

	return template, nil
}

func (r Repo) LoadHelmChartInitialValues(repo, chart, version string) (map[interface{}]interface{}, error) {
	var err error
	strictVersion := version
	if !isValidVersion(version) {
		if registry.IsOCI(repo) {
			strictVersion, err = getOCIStrictVersion(repo, chart, version)
			if err != nil {
				return nil, err
			}
		} else {
			strictVersion, err = getRepoStrictVersion(repo, chart, version)
			if err != nil {
				return nil, err
			}
		}
	}

	cached, ok := r.cache.GetTemplateInitialValues(repo, chart, strictVersion)
	if ok {
		return cached, nil
	}

	var tgzData []byte
	if registry.IsOCI(repo) {
		tgzData, err = loadOCIHelmChartBytes(repo, chart, version)
		if err != nil {
			return nil, err
		}
	} else {
		tgzData, err = r.loadFromHelmChartRepo(repo, chart, version)
		if err != nil {
			return nil, err
		}
	}

	extractedFiles, err := unpackTgzInMemory(tgzData)
	if err != nil {
		return nil, err
	}

	initial, err := r.mapHelmChartInitialValues(extractedFiles)
	if err != nil {
		return nil, err
	}

	r.cache.SetTemplateInitialValues(repo, chart, strictVersion, initial)

	return initial, nil
}

func IsHelmRepo(repo string) (bool, error) {
	indexURL, err := url.JoinPath(repo, "index.yaml")
	if err != nil {
		return false, err
	}

	req, err := http.NewRequest(http.MethodHead, indexURL, nil)
	if err != nil {
		return false, err
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK, nil
}

func (r Repo) loadFromHelmChartRepo(repo, chart, version string) ([]byte, error) {
	tgzURL, err := getTarUrl(repo, chart, version)
	if err != nil {
		return nil, err
	}

	return downloadFile(tgzURL)
}

func (r Repo) mapHelmChart(chartName string, files map[string][]byte) (*models.Template, error) {
	metadataBytes := []byte{}
	schemaBytes := []byte{}
	chartFiles := make([]*helmchart.File, 0)
	templateFiles := make([]*helmchart.File, 0)
	dependenciesFromChartsDir := make(map[string]map[string][]byte, 0)

	for name, content := range files {
		parts := strings.Split(name, "/")

		if len(parts) == 2 && parts[1] == "Chart.yaml" {
			metadataBytes = content
			continue
		}

		if len(parts) == 2 && parts[1] == "values.schema.json" {
			schemaBytes = content
			continue
		}

		if len(parts) > 2 && parts[1] == "templates" && (parts[2] != "Notes.txt" && parts[2] != "NOTES.txt") {
			templateFiles = append(templateFiles, &helmchart.File{
				Name: path.Join(parts[1:]...),
				Data: content,
			})
			continue
		}

		if len(parts) > 3 && parts[1] == "charts" {
			depName := parts[2]
			if _, ok := dependenciesFromChartsDir[depName]; !ok {
				dependenciesFromChartsDir[depName] = make(map[string][]byte)
			}

			dependenciesFromChartsDir[depName][path.Join(parts[2:]...)] = content
			continue
		}

		chartFiles = append(chartFiles, &helmchart.File{
			Name: name,
			Data: content,
		})

	}

	var schema helm.Property
	// unmarshal values schema only if present
	if len(schemaBytes) > 0 {
		if err := json.Unmarshal(schemaBytes, &schema); err != nil {
			return &models.Template{}, err
		}
	}

	var metadata helmchart.Metadata
	if err := yaml.Unmarshal(metadataBytes, &metadata); err != nil {
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

	return &models.Template{
		Name:         chartName,
		RootField:    mapper.HelmSchemaToFields("", schema, dependencies),
		Files:        chartFiles,
		Templates:    templateFiles,
		Dependencies: dependencies,
	}, nil
}

func (r Repo) mapHelmChartInitialValues(files map[string][]byte) (map[interface{}]interface{}, error) {
	metadataBytes := []byte{}
	valuesBytes := []byte{}
	dependenciesFromChartsDir := make(map[string]map[string][]byte, 0)

	for name, content := range files {
		parts := strings.Split(name, "/")

		if len(parts) == 2 && parts[1] == "Chart.yaml" {
			metadataBytes = content
			continue
		}

		if len(parts) == 2 && parts[1] == "values.yaml" {
			valuesBytes = content
			continue
		}

		if len(parts) > 3 && parts[1] == "charts" {
			depName := parts[2]
			if _, ok := dependenciesFromChartsDir[depName]; !ok {
				dependenciesFromChartsDir[depName] = make(map[string][]byte)
			}

			dependenciesFromChartsDir[depName][path.Join(parts[2:]...)] = content
			continue
		}
	}

	values := make(map[interface{}]interface{})
	if err := yaml.Unmarshal(valuesBytes, &values); err != nil {
		return nil, err
	}

	var metadata helmchart.Metadata
	if err := yaml.Unmarshal(metadataBytes, &metadata); err != nil {
		return nil, err
	}

	// region load dependencies
	for depName, files := range dependenciesFromChartsDir {
		dep, err := r.mapHelmChartInitialValues(files)
		if err != nil {
			return nil, err
		}

		values[depName] = dep
	}

	dependenciesFromMeta, err := r.loadDependenciesInitialValues(metadata)
	if err != nil {
		return nil, err
	}

	for depName, depValues := range dependenciesFromMeta {
		values[depName] = depValues
	}
	// endregion

	return values, nil
}

func getTarUrl(repo, chart, version string) (string, error) {
	indexURL, err := url.JoinPath(repo, "index.yaml")
	if err != nil {
		return "", err
	}

	response, err := http.Get(indexURL)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return "", err
	}

	var data helm.Index
	err = yaml.Unmarshal(body, &data)
	if err != nil {
		return "", err
	}

	if _, ok := data.Entries[chart]; !ok {
		return "", errors.New(fmt.Sprintf("chart %v not found in repo %v", chart, repo))
	}

	v, err := resolveVersion(data.Entries[chart], version)
	if err != nil {
		return "", err
	}

	for _, entry := range data.Entries[chart] {
		if entry.Version == v {
			if len(entry.URLs) == 0 {
				return "", errors.New(fmt.Sprintf("no URL on version %v of chart %v and repo %v", version, chart, repo))
			}

			return entry.URLs[0], nil
		}
	}

	return "", errors.New(fmt.Sprintf("version %v not found in chart %v and repo %v", version, chart, repo))
}

func getRepoStrictVersion(repo, chart, version string) (string, error) {
	indexURL, err := url.JoinPath(repo, "index.yaml")
	if err != nil {
		return "", err
	}

	response, err := http.Get(indexURL)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return "", err
	}

	var data helm.Index
	err = yaml.Unmarshal(body, &data)
	if err != nil {
		return "", err
	}

	if _, ok := data.Entries[chart]; !ok {
		return "", errors.New(fmt.Sprintf("chart %v not found in repo %v", chart, repo))
	}

	return resolveVersion(data.Entries[chart], version)
}

func resolveVersion(indexEntries []helm.IndexEntry, version string) (string, error) {
	if isValidVersion(version) {
		return version, nil
	}

	versions := make([]string, 0, len(indexEntries))
	for _, entry := range indexEntries {
		versions = append(versions, entry.Version)
	}

	return resolveSemver(version, versions)
}

func downloadFile(url string) ([]byte, error) {
	response, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP request failed with status: %s", response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

func unpackTgzInMemory(tgzData []byte) (map[string][]byte, error) {
	// Create a gzip reader
	gzipReader, err := gzip.NewReader(bytes.NewReader(tgzData))
	if err != nil {
		return nil, err
	}
	defer gzipReader.Close()

	tarReader := tar.NewReader(gzipReader)

	files := make(map[string][]byte)

	for {
		header, err := tarReader.Next()

		if err == io.EOF {
			break
		}

		if err != nil {
			return nil, err
		}

		var fileBuffer bytes.Buffer
		if _, err := io.Copy(&fileBuffer, tarReader); err != nil {
			return nil, err
		}

		files[header.Name] = fileBuffer.Bytes()
	}

	return files, nil
}

func dependencyExists(name string, existing []*models.Template) bool {
	for _, ed := range existing {
		if ed.Name == name {
			return true
		}
	}

	return false
}

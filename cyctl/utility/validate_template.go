package utility

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"helm.sh/helm/v4/pkg/cli"
	"helm.sh/helm/v4/pkg/downloader"
	"helm.sh/helm/v4/pkg/getter"
	"helm.sh/helm/v4/pkg/registry"
	"helm.sh/helm/v4/pkg/repo"
	"sigs.k8s.io/yaml"
)

var settings = cli.New()

// Debug function for Helm
func debug(format string, v ...interface{}) {
	if settings.Debug {
		fmt.Fprintf(os.Stderr, "[debug] %s\n", fmt.Sprintf(format, v...))
	}
}

// ValidateTemplate checks if a Helm chart exists in a repo at a specific version
func ValidateTemplate(repoURL, chartPath, version string) error {
	if repoURL == "" || chartPath == "" {
		return fmt.Errorf("repository URL and chart path cannot be empty")
	}

	debug("Validating template: repo=%s, chart=%s, version=%s", repoURL, chartPath, version)

	if strings.HasPrefix(repoURL, "oci://") {
		return validateOCI(repoURL, chartPath, version)
	}
	return validateHTTP(repoURL, chartPath, version)
}

// validateOCI checks if a Helm chart exists in an OCI registry
func validateOCI(repoURL, chartPath, version string) error {
	debug("Validating OCI chart: %s/%s:%s", repoURL, chartPath, version)

	chartRef := fmt.Sprintf("%s/%s", strings.TrimSuffix(repoURL, "/"), chartPath)

	opts := []registry.ClientOption{
		registry.ClientOptDebug(settings.Debug),
		registry.ClientOptCredentialsFile(filepath.Join(os.Getenv("HOME"), ".docker", "config.json")),
	}
	registryClient, err := registry.NewClient(opts...)
	if err != nil {
		return fmt.Errorf("failed to create registry client: %w", err)
	}

	c := &downloader.ChartDownloader{
		Out:              os.Stderr,
		Keyring:          "",
		Verify:           downloader.VerifyNever,
		Getters:          getter.All(settings),
		RegistryClient:   registryClient,
		RepositoryConfig: settings.RepositoryConfig,
		RepositoryCache:  settings.RepositoryCache,
		Options: []getter.Option{
			getter.WithPlainHTTP(true),
		},
	}

	if registry.IsOCI(chartRef) {
		c.Options = append(c.Options, getter.WithRegistryClient(registryClient))
	}

	// Create a temporary directory to simulate a dry-run download
	tempDir, err := os.MkdirTemp("", "helm-validate-*")
	if err != nil {
		return fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// Attempt to download (dry-run)
	_, _, err = c.DownloadTo(chartRef, version, tempDir)
	if err != nil {
		return fmt.Errorf("chart %q with version %q not found in %q: %w", chartPath, version, repoURL, err)
	}

	debug("OCI chart validation successful")
	return nil
}

// validateHTTP checks if a Helm chart exists in an HTTP(S) repository
func validateHTTP(repoURL, chartPath, version string) error {
	debug("Validating HTTP chart: %s/%s:%s", repoURL, chartPath, version)

	entry := &repo.Entry{
		Name: "temp-repo",
		URL:  repoURL,
	}

	chartRepo, err := repo.NewChartRepository(entry, getter.All(settings))
	if err != nil {
		return fmt.Errorf("failed to create chart repository: %w", err)
	}

	indexFilePath, err := chartRepo.DownloadIndexFile()
	if err != nil {
		return fmt.Errorf("could not download index file: %w", err)
	}

	indexBytes, err := os.ReadFile(indexFilePath)
	if err != nil {
		return fmt.Errorf("failed to read index file: %w", err)
	}

	var index repo.IndexFile
	if err := yaml.Unmarshal(indexBytes, &index); err != nil {
		return fmt.Errorf("failed to parse index file: %w", err)
	}

	if index.Has(chartPath, version) {
		debug("HTTP chart validation successful")
		return nil
	}

	return fmt.Errorf("chart %q with version %q not found in %q", chartPath, version, repoURL)
}

// FetchTemplatePath fetches the actual path to the template for later use
func FetchTemplatePath(repoURL, chartPath, version string) (string, error) {
	if err := ValidateTemplate(repoURL, chartPath, version); err != nil {
		return "", err
	}

	if strings.HasPrefix(repoURL, "oci://") {
		return fetchOCITemplate(repoURL, chartPath, version)
	}
	return fetchHTTPTemplate(repoURL, chartPath, version)
}

// fetchOCITemplate pulls an OCI chart and returns its local path
func fetchOCITemplate(repoURL, chartPath, version string) (string, error) {
	chartRef := fmt.Sprintf("%s/%s", strings.TrimSuffix(repoURL, "/"), chartPath)

	opts := []registry.ClientOption{
		registry.ClientOptDebug(settings.Debug),
		registry.ClientOptCredentialsFile(filepath.Join(os.Getenv("HOME"), ".docker", "config.json")),
	}
	registryClient, err := registry.NewClient(opts...)
	if err != nil {
		return "", fmt.Errorf("failed to create registry client: %w", err)
	}

	c := &downloader.ChartDownloader{
		Out:              os.Stderr,
		Keyring:          "",
		Verify:           downloader.VerifyNever,
		Getters:          getter.All(settings),
		RegistryClient:   registryClient,
		RepositoryConfig: settings.RepositoryConfig,
		RepositoryCache:  settings.RepositoryCache,
		Options: []getter.Option{
			getter.WithPlainHTTP(true),
		},
	}

	if registry.IsOCI(chartRef) {
		c.Options = append(c.Options, getter.WithRegistryClient(registryClient))
	}

	tempDir, err := os.MkdirTemp("", "helm-fetch-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}

	saved, _, err := c.DownloadTo(chartRef, version, tempDir)
	if err != nil {
		os.RemoveAll(tempDir)
		return "", fmt.Errorf("failed to download OCI chart: %w", err)
	}

	return saved, nil
}

// fetchHTTPTemplate pulls an HTTP chart and returns its local path
func fetchHTTPTemplate(repoURL, chartPath, version string) (string, error) {
	entry := &repo.Entry{
		Name: "temp-repo",
		URL:  repoURL,
	}

	chartRepo, err := repo.NewChartRepository(entry, getter.All(settings))
	if err != nil {
		return "", fmt.Errorf("failed to create chart repository: %w", err)
	}

	indexFilePath, err := chartRepo.DownloadIndexFile()
	if err != nil {
		return "", fmt.Errorf("could not download index file: %w", err)
	}

	indexBytes, err := os.ReadFile(indexFilePath)
	if err != nil {
		return "", fmt.Errorf("failed to read index file: %w", err)
	}

	var index repo.IndexFile
	if err := yaml.Unmarshal(indexBytes, &index); err != nil {
		return "", fmt.Errorf("failed to parse index file: %w", err)
	}

	chartVersion, err := index.Get(chartPath, version)
	if err != nil {
		return "", fmt.Errorf("chart %q with version %q not found in %q: %w", chartPath, version, repoURL, err)
	}

	chartURL := chartVersion.URLs[0]

	c := &downloader.ChartDownloader{
		Out:     os.Stderr,
		Keyring: "",
		Verify:  downloader.VerifyNever,
		Getters: getter.All(settings),
		Options: []getter.Option{
			getter.WithPlainHTTP(true),
		},
	}

	tempDir, err := os.MkdirTemp("", "helm-fetch-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}

	saved, _, err := c.DownloadTo(chartURL, version, tempDir)
	if err != nil {
		os.RemoveAll(tempDir)
		return "", fmt.Errorf("failed to download HTTP chart: %w", err)
	}

	return saved, nil
}

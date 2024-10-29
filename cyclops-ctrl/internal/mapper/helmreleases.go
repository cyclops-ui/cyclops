package mapper

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/pkg/errors"

	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/release"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
)

func MapHelmReleases(releases []*release.Release) ([]*models.HelmRelease, error) {
	out := make([]*models.HelmRelease, 0, len(releases))

	for _, r := range releases {
		if r == nil {
			continue
		}

		r, _ := mapHelmReleasePreview(r)
		out = append(out, r)
	}

	return out, nil
}

func mapHelmReleasePreview(release *release.Release) (*models.HelmRelease, error) {
	var chartName, chartVersion string
	var containsSchema bool
	if release.Chart != nil {
		chartName = release.Chart.Name()
		containsSchema = len(release.Chart.Schema) > 0

		if release.Chart.Metadata != nil {
			chartVersion = release.Chart.Metadata.Version
		}
	}

	return &models.HelmRelease{
		Name:           release.Name,
		Namespace:      release.Namespace,
		Chart:          chartName,
		Version:        chartVersion,
		Revision:       fmt.Sprintf("v%d", release.Version),
		ContainsSchema: containsSchema,
	}, nil
}

func MapHelmRelease(release *release.Release) (*models.HelmRelease, error) {
	values, err := chartutil.CoalesceValues(release.Chart, release.Config)
	if err != nil {
		return nil, err
	}

	var chartName, chartVersion string
	var containsSchema bool
	if release.Chart != nil {
		chartName = release.Chart.Name()
		containsSchema = len(release.Chart.Schema) > 0

		if release.Chart.Metadata != nil {
			chartVersion = release.Chart.Metadata.Version
		}
	}

	return &models.HelmRelease{
		Name:           release.Name,
		Namespace:      release.Namespace,
		Chart:          chartName,
		Version:        chartVersion,
		Revision:       fmt.Sprintf("v%d", release.Version),
		Values:         values,
		Sources:        mapChartSources(release.Chart),
		ContainsSchema: containsSchema,
	}, nil
}

func mapChartSources(chart *chart.Chart) []*models.TemplateSource {
	if chart == nil || chart.Metadata == nil {
		return nil
	}

	out := make([]*models.TemplateSource, 0)

	for _, source := range chart.Metadata.Sources {
		suggestion, err := mapGitHubSource(source)
		if err != nil {
			continue
		}

		out = append(out, suggestion)
	}

	return out
}

func mapGitHubSource(source string) (*models.TemplateSource, error) {
	parsedURL, err := url.Parse(source)
	if err != nil {
		return nil, err
	}

	if parsedURL.Host != "github.com" {
		return nil, errors.New("error: URL is not a valid GitHub link")
	}

	parts := strings.Split(strings.Trim(parsedURL.Path, "/"), "/")
	if len(parts) < 2 {
		return nil, errors.New("error: URL path is incomplete")
	}

	repo := fmt.Sprintf("https://%s/%s/%s", parsedURL.Host, parts[0], parts[1])

	var revision string
	var path string
	if len(parts) > 2 {
		for i := 2; i < len(parts); i++ {
			if parts[i] == "tree" || parts[i] == "blob" {
				if i+1 < len(parts) {
					revision = parts[i+1]
					if i+2 < len(parts) {
						path = strings.Join(parts[i+2:], "/")
					}
					break
				} else {
					return nil, errors.New("error: URL is missing revision")
				}
			}
		}
	}

	return &models.TemplateSource{
		URL:     repo,
		Path:    path,
		Version: revision,
		Full:    source,
	}, nil
}

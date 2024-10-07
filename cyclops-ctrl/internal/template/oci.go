package template

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"

	json "github.com/json-iterator/go"
	"github.com/pkg/errors"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
)

func (r Repo) LoadOCIHelmChart(repo, chart, version, resolvedVersion string) (*models.Template, error) {
	var err error
	strictVersion := version

	if len(resolvedVersion) > 0 {
		strictVersion = resolvedVersion
	} else if !isValidVersion(version) {
		strictVersion, err = getOCIStrictVersion(repo, chart, version)
		if err != nil {
			return nil, err
		}
	}

	cached, ok := r.cache.GetTemplate(repo, chart, strictVersion, string(cyclopsv1alpha1.TemplateSourceTypeOCI))
	if ok {
		return cached, nil
	}

	var tgzData []byte
	tgzData, err = loadOCIHelmChartBytes(repo, chart, version)
	if err != nil {
		return nil, err
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

	r.cache.SetTemplate(repo, chart, strictVersion, string(cyclopsv1alpha1.TemplateSourceTypeOCI), template)

	return template, nil
}

func (r Repo) LoadOCIHelmChartInitialValues(repo, chart, version string) (map[string]interface{}, error) {
	var err error
	strictVersion := version
	if !isValidVersion(version) {
		strictVersion, err = getOCIStrictVersion(repo, chart, version)
		if err != nil {
			return nil, err
		}
	}

	cached, ok := r.cache.GetTemplateInitialValues(repo, chart, strictVersion, string(cyclopsv1alpha1.TemplateSourceTypeOCI))
	if ok {
		return cached, nil
	}

	tgzData, err := loadOCIHelmChartBytes(repo, chart, version)
	if err != nil {
		return nil, err
	}

	extractedFiles, err := unpackTgzInMemory(tgzData)
	if err != nil {
		return nil, err
	}

	initial, err := r.mapHelmChartInitialValues(extractedFiles)
	if err != nil {
		return nil, err
	}

	r.cache.SetTemplateInitialValues(repo, chart, strictVersion, string(cyclopsv1alpha1.TemplateSourceTypeOCI), initial)

	return initial, nil
}

func loadOCIHelmChartBytes(repo, chart, version string) ([]byte, error) {
	var err error
	if !isValidVersion(version) {
		version, err = getOCIStrictVersion(repo, chart, version)
		if err != nil {
			return nil, err
		}
	}

	token, err := authorizeOCI(repo, chart, version)
	if err != nil {
		return nil, err
	}

	digest, err := fetchDigest(repo, chart, version, token)
	if err != nil {
		return nil, err
	}

	contentDigest, err := fetchContentDigest(repo, chart, digest, token)
	if err != nil {
		return nil, err
	}

	return loadOCITar(repo, chart, contentDigest, token)
}

func loadOCITar(repo, chart, digest, token string) ([]byte, error) {
	bURL, err := blobURL(repo, chart, digest)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodGet, bURL.String(), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "Helm/3.13.3")
	req.Header.Set("Accept", "application/vnd.cncf.helm.config.v1+json, */*")
	if len(token) != 0 {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %v", token))
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return ioutil.ReadAll(resp.Body)
}

func fetchContentDigest(repo, chart, digest, token string) (string, error) {
	dURL, err := contentDigestURL(repo, chart, digest)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodGet, dURL.String(), nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "Helm/3.13.3")
	req.Header.Set("Accept", "application/vnd.oci.image.manifest.v1+json, */*")
	if len(token) != 0 {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %v", token))
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	responseBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var ct struct {
		Layers []struct {
			Digest string `json:"digest"`
		} `json:"layers"`
	}

	if err := json.Unmarshal(responseBody, &ct); err != nil {
		return "", err
	}

	if len(ct.Layers) == 0 {
		return "", nil
	}

	return ct.Layers[0].Digest, nil
}

func fetchDigest(repo, chart, version, token string) (string, error) {
	dURL, err := digestURL(repo, chart, version)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodHead, dURL.String(), nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "Helm/3.13.3")
	req.Header.Set("Accept", "application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.oci.image.index.v1+json, */*")
	if len(token) != 0 {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %v", token))
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	return resp.Header.Get("docker-content-digest"), nil
}

func getOCIStrictVersion(repo, chart, version string) (string, error) {
	token, err := authorizeOCITags(repo, chart)
	if err != nil {
		return "", err
	}

	tURL, err := tagsURL(repo, chart)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodGet, tURL.String(), nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "Helm/3.13.3")
	if len(token) != 0 {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %v", token))
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	responseBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var tagsResp struct {
		Tags []string `json:"tags"`
	}

	if err := json.Unmarshal(responseBody, &tagsResp); err != nil {
		return "", err
	}

	return resolveSemver(version, tagsResp.Tags)
}

func authorizeOCI(repo, chart, version string) (string, error) {
	// region head
	dURL, err := digestURL(repo, chart, version)
	if err != nil {
		return "", err
	}

	client := &http.Client{}

	req, err := http.NewRequest(http.MethodHead, dURL.String(), nil)
	if err != nil {
		return "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var authUrlRealm, service, scope string
	if resp.StatusCode == http.StatusOK {
		return "", nil
	} else if resp.StatusCode == http.StatusUnauthorized {
		authUrlRealm, service, scope = parseAuthenticateHeader(resp.Header.Get("WWW-Authenticate"))
	}

	if resp.StatusCode != http.StatusUnauthorized {
		return "", errors.New(fmt.Sprintf("unexpected status code: %v", resp.StatusCode))
	}

	// endregion

	// region get token

	params := url.Values{}
	params.Add("service", service)
	params.Add("scope", scope)

	authUrl := fmt.Sprintf("%v?%v", authUrlRealm, params.Encode())

	req, err = http.NewRequest(http.MethodGet, authUrl, nil)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return "", err
	}

	req.Header.Set("User-Agent", "Helm/3.13.3")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded; charset=utf-8")

	resp, err = client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	responseBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var ar struct {
		Token string `json:"token"`
	}

	if err := json.Unmarshal(responseBody, &ar); err != nil {
		return "", err
	}

	return ar.Token, nil

	// endregion
}

func authorizeOCITags(repo, chart string) (string, error) {
	// region head
	tURL, err := tagsURL(repo, chart)
	if err != nil {
		return "", err
	}

	client := &http.Client{}

	req, err := http.NewRequest(http.MethodHead, tURL.String(), nil)
	if err != nil {
		return "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var authUrlRealm, service, scope string
	if resp.StatusCode == http.StatusOK {
		return "", nil
	} else if resp.StatusCode == http.StatusUnauthorized {
		authUrlRealm, service, scope = parseAuthenticateHeader(resp.Header.Get("WWW-Authenticate"))
	}

	if resp.StatusCode != http.StatusUnauthorized {
		return "", errors.New(fmt.Sprintf("unexpected status code: %v", resp.StatusCode))
	}

	// endregion

	// region get token
	params := url.Values{}
	params.Add("service", service)
	params.Add("scope", scope)

	authUrl := fmt.Sprintf("%v?%v", authUrlRealm, params.Encode())

	req, err = http.NewRequest(http.MethodGet, authUrl, nil)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return "", err
	}

	req.Header.Set("User-Agent", "Helm/3.13.3")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded; charset=utf-8")

	resp, err = client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	responseBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var ar struct {
		Token string `json:"access_token"`
	}

	if err := json.Unmarshal(responseBody, &ar); err != nil {
		return "", err
	}

	return ar.Token, nil

	// endregion
}

func parseAuthenticateHeader(header string) (realm, service, scope string) {
	header = strings.TrimPrefix(header, "Bearer ")

	pairs := strings.Split(header, ",")

	for _, pair := range pairs {
		keyValue := strings.SplitN(pair, "=", 2)
		if len(keyValue) == 2 {
			key := strings.TrimSpace(keyValue[0])
			value := strings.Trim(keyValue[1], `"`)

			switch key {
			case "realm":
				realm = value
			case "service":
				service = value
			case "scope":
				scope = value
			}
		}
	}

	return realm, service, scope
}

func digestURL(repo, chart, version string) (*url.URL, error) {
	repoURL, err := url.Parse(repo)
	if err != nil {
		return nil, err
	}

	return &url.URL{
		Scheme: "https",
		Host:   repoURL.Host,
		Path:   fmt.Sprintf("v2/%v/%v/manifests/%v", repoURL.Path, chart, version),
	}, nil
}

func contentDigestURL(repo, chart, digest string) (*url.URL, error) {
	repoURL, err := url.Parse(repo)
	if err != nil {
		return nil, err
	}

	return &url.URL{
		Scheme: "https",
		Host:   repoURL.Host,
		Path:   fmt.Sprintf("v2/%v/%v/manifests/%v", repoURL.Path, chart, digest),
	}, nil
}

func blobURL(repo, chart, digest string) (*url.URL, error) {
	repoURL, err := url.Parse(repo)
	if err != nil {
		return nil, err
	}

	return &url.URL{
		Scheme: "https",
		Host:   repoURL.Host,
		Path:   fmt.Sprintf("v2/%v/%v/blobs/%v", repoURL.Path, chart, digest),
	}, nil
}

func tagsURL(repo, chart string) (*url.URL, error) {
	repoURL, err := url.Parse(repo)
	if err != nil {
		return nil, err
	}

	return &url.URL{
		Scheme: "https",
		Host:   repoURL.Host,
		Path:   fmt.Sprintf("v2/%v/%v/tags/list", repoURL.Path, chart),
	}, nil
}

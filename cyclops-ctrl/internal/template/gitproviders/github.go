package gitproviders

import (
	"fmt"
	"github.com/cyclops-ui/cycops-ctrl/internal/auth"
	"github.com/pkg/errors"
	"io/ioutil"
	"net/http"
	"net/url"
	path2 "path"
	"path/filepath"
	"strings"
)

func IsGitHubSource(repoURL string) bool {
	host, err := url.Parse(repoURL)
	if err != nil {
		return false
	}

	return host.Host == "github.com"
}

func GitHubClone(repoURL, commitSHA string, creds *auth.Credentials) ([]byte, error) {
	repoURLparsed, err := url.Parse(repoURL)
	if err != nil {
		return nil, err
	}

	pathParts := strings.Split(repoURLparsed.Path, "/")
	var organization, repository string
	if len(pathParts) == 3 {
		organization = pathParts[1]
		repository = pathParts[2]
	} else {
		return nil, errors.New("invalid github repo URL; should be https://github.com/<org>/<repo>")
	}

	return gitHubTarball(organization, repository, commitSHA, creds)
}

func gitHubTarball(org, repo, commitSHA string, creds *auth.Credentials) ([]byte, error) {
	req, err := http.NewRequest(
		http.MethodGet,
		fmt.Sprintf("https://api.github.com/repos/%v/%v/tarball/%v", org, repo, commitSHA),
		nil,
	)
	if err != nil {
		return nil, err
	}

	token := authToken(creds)
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

func authToken(creds *auth.Credentials) string {
	if creds == nil {
		return ""
	}

	return creds.Password
}

func SanitizeGHFiles(files map[string][]byte, path string) map[string][]byte {
	out := make(map[string][]byte, len(files))

	for key, value := range files {
		fmt.Println("key", key)
		repoFileName := removeFirstSegment(key)
		if len(repoFileName) == 0 {
			continue
		}

		if !strings.HasPrefix(repoFileName, path) {
			continue
		}

		trimmed := strings.TrimPrefix(repoFileName, path)

		path2.Split(trimmed)
		path2.Join(path2.Split())

		out[repoFileName] = value
	}

	return out
}

func removeFirstSegment(path string) string {
	segments := strings.Split(path, "/")

	if len(segments) <= 1 {
		return ""
	}

	return filepath.Join(segments[1:]...)
}

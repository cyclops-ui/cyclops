package gitproviders

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	path2 "path"
	"strings"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/auth"

	"github.com/pkg/errors"
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
        // Normalize repository name: strip trailing .git if present
        repoName := pathParts[2]
        if strings.HasSuffix(repoName, ".git") {
            repoName = strings.TrimSuffix(repoName, ".git")
        }
        repository = repoName
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
    // GitHub API requires a User-Agent; set a JSON Accept per REST v3
    req.Header.Set("User-Agent", "cyclops-ctrl")
    req.Header.Set("Accept", "application/vnd.github+json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    // Provide clearer errors on non-200 responses (rate limits, bad refs, private repos)
    if resp.StatusCode != http.StatusOK {
        body, _ := ioutil.ReadAll(resp.Body)
        // Limit body in error to avoid huge payloads
        max := 512
        if len(body) > max {
            body = body[:max]
        }
        hint := "ensure the branch/tag/commit exists; for private repos add a token; avoid trailing .git in the URL"
        if resp.StatusCode == http.StatusUnsupportedMediaType {
            hint = "do not set a custom Accept header; use default media for tarball (controller handles it)"
        } else if resp.StatusCode == http.StatusForbidden {
            hint = "rate limited or access denied; add a GitHub token via TemplateAuthRule"
        } else if resp.StatusCode == http.StatusNotFound {
            hint = "repo or ref not found; check org/repo name and commit/branch/tag"
        }
        return nil, errors.Errorf(
            "GitHub tarball fetch failed: status %d. Repo: %s/%s, Ref: %s. Hint: %s. Response: %s",
            resp.StatusCode, org, repo, commitSHA, hint, string(body),
        )
    }

    return ioutil.ReadAll(resp.Body)
}

func authToken(creds *auth.Credentials) string {
	if creds == nil {
		return ""
	}

	return creds.Password
}

func SanitizeGHFiles(files map[string][]byte, path string) (map[string][]byte, bool) {
	out := make(map[string][]byte)

	for key, value := range files {
		repoFileName := removeFirstSegment(key)
		if len(repoFileName) == 0 {
			continue
		}

		if !strings.HasPrefix(repoFileName, fmt.Sprintf("%v/", path)) {
			continue
		}

		trimmed := strings.TrimPrefix(repoFileName, path)
		_, folder := path2.Split(path)
		out[path2.Join(folder, trimmed)] = value
	}

	if len(out) == 0 {
		return nil, false
	}

	return out, true
}

func removeFirstSegment(path string) string {
	segments := strings.Split(path, `/`)

	if len(segments) <= 1 {
		return ""
	}

	return strings.Join(segments[1:], `/`)
}

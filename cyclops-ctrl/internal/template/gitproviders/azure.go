package gitproviders

import "net/url"

func IsAzureRepo(repoURL string) bool {
	host, err := url.Parse(repoURL)
	if err != nil {
		return false
	}

	return host.Host == "dev.azure.com"
}

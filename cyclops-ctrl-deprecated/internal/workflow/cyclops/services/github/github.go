package github

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
)

type API struct {
	client http.Client
}

func NewAPI() *API {
	return &API{
		client: http.Client{},
	}
}

const _githubAPIHost = "https://api.github.com"

func (a *API) GetFileContent(filename string) (Response, error) {
	apiResponse, err := a.client.Get(_githubAPIHost + "/repos/petar-cvit/chat-app-server/contents/docker-compose.yml")
	if err != nil {
		return Response{}, err
	}

	data, err := ioutil.ReadAll(apiResponse.Body)
	if err != nil {
		return Response{}, err
	}

	var resp Response
	if err := json.Unmarshal(data, &resp); err != nil {
		return Response{}, err
	}

	return resp, nil
}

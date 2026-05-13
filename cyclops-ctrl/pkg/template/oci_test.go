package template

import (
	"net/http"
	"testing"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/auth"
)

func TestSetOCIRegistryAuthUsesBearerTokenFirst(t *testing.T) {
	req, err := http.NewRequest(http.MethodGet, "https://registry.example.com/v2/chart/manifests/1.0.0", nil)
	if err != nil {
		t.Fatal(err)
	}

	setOCIRegistryAuth(req, "registry-token", &auth.Credentials{
		Username: "template-user",
		Password: "template-pass",
	})

	if got, want := req.Header.Get("Authorization"), "Bearer registry-token"; got != want {
		t.Fatalf("Authorization header = %q, want %q", got, want)
	}
}

func TestSetOCIRegistryAuthFallsBackToTemplateBasicAuth(t *testing.T) {
	req, err := http.NewRequest(http.MethodGet, "https://registry.example.com/v2/chart/blobs/sha256:abc", nil)
	if err != nil {
		t.Fatal(err)
	}

	setOCIRegistryAuth(req, "", &auth.Credentials{
		Username: "template-user",
		Password: "template-pass",
	})

	username, password, ok := req.BasicAuth()
	if !ok {
		t.Fatal("expected request to use HTTP Basic auth")
	}

	if username != "template-user" || password != "template-pass" {
		t.Fatalf("Basic auth = %q/%q, want template-user/template-pass", username, password)
	}
}

func TestSetOCIRegistryAuthLeavesPublicRequestUnauthenticated(t *testing.T) {
	req, err := http.NewRequest(http.MethodGet, "https://registry.example.com/v2/chart/tags/list", nil)
	if err != nil {
		t.Fatal(err)
	}

	setOCIRegistryAuth(req, "", nil)

	if got := req.Header.Get("Authorization"); got != "" {
		t.Fatalf("Authorization header = %q, want empty", got)
	}

	if _, _, ok := req.BasicAuth(); ok {
		t.Fatal("did not expect HTTP Basic auth on public request")
	}
}

func TestSetOCITokenAuthUsesTemplateBasicAuth(t *testing.T) {
	req, err := http.NewRequest(http.MethodGet, "https://registry.example.com/token", nil)
	if err != nil {
		t.Fatal(err)
	}

	setOCITokenAuth(req, &auth.Credentials{
		Username: "template-user",
		Password: "template-pass",
	})

	username, password, ok := req.BasicAuth()
	if !ok {
		t.Fatal("expected token request to use HTTP Basic auth")
	}

	if username != "template-user" || password != "template-pass" {
		t.Fatalf("Basic auth = %q/%q, want template-user/template-pass", username, password)
	}
}

func TestOCIAuthorizationTokenResponseAcceptsAccessToken(t *testing.T) {
	token, err := parseOCITokenResponse([]byte(`{"access_token":"registry-access-token"}`))
	if err != nil {
		t.Fatal(err)
	}

	if got, want := token, "registry-access-token"; got != want {
		t.Fatalf("token = %q, want %q", got, want)
	}
}

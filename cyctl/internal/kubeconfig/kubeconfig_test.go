package kubeconfig

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/spf13/cobra"
)

// TestGetKubeConfigDoesNotPanic verifies that loading a kubeconfig which is
// missing or invalid no longer panics (see issue #880). It should surface a
// clean error and exit instead of crashing, so that cluster-free commands
// like `completion` and `version` remain usable.
//
// The prerun calls os.Exit(1) on a missing kubeconfig, so we assert the
// no-panic behavior in a subprocess that the parent can observe via exit code.
func TestGetKubeConfigDoesNotPanic(t *testing.T) {
	if os.Getenv("BE_CRASHER") == "1" {
		dir := t.TempDir()
		missingKubeconfig := filepath.Join(dir, "does-not-exist")
		t.Setenv("KUBECONFIG", missingKubeconfig)

		cmd := &cobra.Command{Use: "cyctl"}
		GetKubeConfig()(cmd, nil)
		return
	}

	cmd := exec.Command(os.Args[0], "-test.run=TestGetKubeConfigDoesNotPanic")
	cmd.Env = append(os.Environ(), "BE_CRASHER=1")
	if err := cmd.Run(); err != nil {
		// A panic would surface as an exit code 2 (Go test panic) rather
		// than the expected os.Exit(1). Fail only on a panic signal.
		if exitErr, ok := err.(*exec.ExitError); ok {
			if exitErr.ExitCode() == 2 {
				t.Fatalf("GetKubeConfig panicked on missing kubeconfig: %v", err)
			}
		}
	}
}

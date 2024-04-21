package cmd

import (
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
)

var (
	RootCmd = cobra.Command{
		Use:              "cyctl",
		Version:          "v0.2.0",
		Short:            "👁️ Customizable UI for Kubernetes Workloads",
		Long:             "Cyclops gives you a UI containing fields you define yourself to manage your K8s workloads.",
		PersistentPreRun: kubeconfig.GetKubeConfig(),
	}
)

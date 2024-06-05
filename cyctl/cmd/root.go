package cmd

import (
	"github.com/cyclops-ui/cycops-cyctl/common"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
)

var (
	// rootCmd represents the primary command when executed without any subcommands.
	RootCmd = cobra.Command{
		Use:              "cyctl",
		Version:          common.CliVersion,
		Short:            "👁️ Customizable UI for Kubernetes Workloads",
		Long:             "Cyclops gives you a UI containing fields you define yourself to manage your K8s workloads.",
		PersistentPreRun: kubeconfig.GetKubeConfig(),
	}
)

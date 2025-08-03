package cmd

import (
	"github.com/spf13/cobra"
)

var (
	helmExample = `  # Migrate Helm releases to Cyclops modules
  cyctl helm migrate --namespace mynamespace --repo https://charts.bitnami.com/bitnami --path postgresql --version 12.5.6`
)

var helmCmd = &cobra.Command{
	Use:     "helm",
	Short:   "Helm release related operations",
	Long:    "Helm release related operations like migrating releases to Cyclops modules",
	Example: helmExample,
}

func init() {
	RootCmd.AddCommand(helmCmd)
}

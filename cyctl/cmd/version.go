package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var versionCMD = &cobra.Command{
	Use:   "version",
	Short: "Prints the version of cyctl",
	Long:  "Prints the version of cyctl",
	Run: func(cmd *cobra.Command, args []string) {
		var version = RootCmd.Version
		fmt.Fprintf(os.Stderr, "%s\n", version)
	},
}

func init() {
	RootCmd.AddCommand(versionCMD)
}

package cmd

import (
	"fmt"
	"runtime"

	"github.com/cyclops-ui/cycops-cyctl/common"
	"github.com/spf13/cobra"
)

const cyclopsLogo = `
  ____           _                 
 / ___|   _  ___| | ___  _ __  ___ 
| |  | | | |/ __| |/ _ \| '_ \/ __|
| |__| |_| | (__| | (_) | |_) \__ \
 \____\__, |\___|_|\___/| .__/|___/
      |___/             |_|        
`

var (
	verbose bool
	concise bool
)

var versionCMD = &cobra.Command{
	Use:   "version",
	Short: "Prints the version of cyctl",
	Long:  "Prints the version of cyctl",
	Run: func(cmd *cobra.Command, args []string) {
		switch {
		case verbose:
			fmt.Printf(cyclopsLogo)
			fmt.Printf("Client version: v%s\n", common.CliVersion)
			fmt.Printf("Go version (client): %s\n", runtime.Version())
			fmt.Printf("OS/Arch (client): %s/%s\n", runtime.GOOS, runtime.GOARCH)
		case concise:
			fmt.Printf("%s\n", common.CliVersion)
		default:
			fmt.Printf("Cyclops CLI v%s\n", common.CliVersion)
		}
	},
}

func init() {
	versionCMD.Flags().BoolVarP(&verbose, "verbose", "v", false, "Use verbose output to see full version")
	versionCMD.Flags().BoolVarP(&concise, "concise", "c", false, "Use concise output to see brief version information")

	RootCmd.AddCommand(versionCMD)
}

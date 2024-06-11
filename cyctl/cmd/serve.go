package cmd

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/spf13/cobra"
)

var serveCMD = &cobra.Command{
	Use:   "serve",
	Short: "start the cyclops UI",
	Long:  "start the cyclops UI by forwarding the cyclops UI service's port to a local port",
	Run: func(cmd *cobra.Command, args []string) {
		command := exec.Command("kubectl", "port-forward", "svc/cyclops-ui", "3000:3000", "-n", "cyclops")
		command.Stdout = os.Stdout
		command.Stderr = os.Stderr
		err := command.Run()
		if err != nil {
			fmt.Printf("error executing command: %s\n", err.Error())
			os.Exit(1)
		}
	},
}

func init() {
	RootCmd.AddCommand(serveCMD)
}

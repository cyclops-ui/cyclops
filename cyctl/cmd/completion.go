package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var completionCmd = &cobra.Command{
	Use:   "completion [bash|zsh|fish|powershell]",
	Short: "Generate completion script",
	Long: `To load completions:

Bash:
	$ source <(cyctl completion bash)

	# To load completions for each session, execute once:
	# Linux:
	$ cyctl completion bash > /etc/bash_completion.d/cyctl
	# macOS:
	$ cyctl completion bash > /usr/local/etc/bash_completion.d/cyctl

Zsh:
	# If shell completion is not already enabled in your environment,
	# you will need to enable it.  You can execute the following once:

	$ echo "autoload -U compinit; compinit" >> ~/.zshrc

	# To load completions for each session, execute once:
	$ cyctl completion zsh > "${fpath[1]}/_cyctl"

	# You will need to start a new shell for this setup to take effect.

Fish:
	$ cyctl completion fish | source

	# To load completions for each session, execute once:
	$ cyctl completion fish > ~/.config/fish/completions/cyctl.fish

PowerShell:
	PS> cyctl completion powershell | Out-String | Invoke-Expression

	# To load completions for every PowerShell session, run:
	PS> cyctl completion powershell > cyctl.ps1
	# and source this file from your PowerShell profile.
`,
	DisableFlagsInUseLine: true,
	ValidArgs:             []string{"bash", "zsh", "fish", "powershell"},
	Args:                  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
	// Override root's PersistentPreRun so kubeconfig is not loaded for completions
	PersistentPreRun: func(cmd *cobra.Command, args []string) {},
	Run: func(cmd *cobra.Command, args []string) {
		switch args[0] {
		case "bash":
			cmd.Root().GenBashCompletion(os.Stdout)
		case "zsh":
			cmd.Root().GenZshCompletion(os.Stdout)
		case "fish":
			cmd.Root().GenFishCompletion(os.Stdout, true)
		case "powershell":
			cmd.Root().GenPowerShellCompletionWithDesc(os.Stdout)
		}
	},
}

func init() {
	RootCmd.AddCommand(completionCmd)
}

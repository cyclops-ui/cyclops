package cmd

import (
	"github.com/spf13/cobra"
)

var (
	reconcileExample = `# Reconcile the Module 
	cyctl reconcile <module  name>`
)

var reconcileCMD = &cobra.Command{
	Use:     "reconcile",
	Short:   "Will reconcile the Module and update the current TimeStamp",
	Long:    "Will reconcile the Module and update the current TimeStamp",
	Example: reconcileExample,
	//Run: func(cmd *cobra.Command, args []string){},
}

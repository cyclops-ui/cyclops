package main

import (
	"fmt"
	"gitops/internal/api/server"
	"gitops/internal/workflow/cyclops"
)

func main() {
	workflowRunner, err := cyclops.NewWorkflowRunner()
	if err != nil {
		fmt.Println(err)
	}

	apiServer, err := server.New(workflowRunner)
	if err != nil {
		fmt.Println(err)
	}

	if err = apiServer.Start(); err != nil {
		fmt.Println(err)
	}
}

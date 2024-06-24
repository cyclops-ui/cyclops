package main

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra/doc"
	
	"github.com/cyclops-ui/cycops-cyctl/cmd"
)

func main() {
	err := doc.GenMarkdownTreeCustom(cmd.RootCmd.Root(), "./docs", func(s string) string {
		command := strings.TrimSuffix(filepath.Base(s), ".md")
		return fmt.Sprintf("# %v\n", strings.ReplaceAll(command, "_", " "))
	}, func(s string) string { return s })
	if err != nil {
		log.Fatal(err)
	}
}

package main

import (
	"fmt"
	"github.com/cyclops-ui/cycops-cyctl/cmd"
	"github.com/spf13/cobra/doc"
	"log"
	"path/filepath"
	"strings"
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

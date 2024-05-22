package common

import (
	"fmt"

	"github.com/savioxavier/termlink"
)

var (
	CliVersion = "0.2.0"
)

// IssueMessage displays a message when an error occurs.
func ReportIssue() {
	gitIssueLink := termlink.ColorLink("GitHub issue", "https://github.com/cyclops-ui/cyclops/issues", "green")
	fmt.Printf("Please update to the latest CLI version and try again. If the problem persists, report it on Discord or open a GitHub issue: %s \n", gitIssueLink)
}

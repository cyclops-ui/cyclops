package main

import (
	"fmt"

	"helm.sh/helm/v3/pkg/chart/loader"
)

func main() {
	chart, err := loader.LoadDir("charts/devnet")
	if err != nil {
		panic(err)
	}

	fmt.Println(chart.Files)
}

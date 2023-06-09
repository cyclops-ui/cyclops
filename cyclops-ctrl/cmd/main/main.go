package main

import "github.com/cyclops-ui/cycops-ctrl/internal/handler"

func main() {
	handler, err := handler.New()
	if err != nil {
		panic(err)
	}

	handler.Start()
}

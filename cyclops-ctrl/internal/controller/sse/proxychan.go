package sse

import (
	"context"
	"time"

	"k8s.io/apimachinery/pkg/watch"
)

type ProxyChan struct {
	input  <-chan watch.Event
	output chan any
}

func NewProxyChan(ctx context.Context, input <-chan watch.Event, interval time.Duration) ProxyChan {
	p := ProxyChan{
		input:  input,
		output: make(chan any),
	}

	go func() {
		ticker := time.NewTicker(interval)
		defer func() {
			ticker.Stop()
		}()

		for {
			select {
			case _, ok := <-p.input:
				if !ok {
					return
				}
				p.output <- true

			case <-ticker.C:
				p.output <- true

			case <-ctx.Done():
				return
			}
		}
	}()

	return p
}

func (p ProxyChan) Events() chan any {
	return p.output
}

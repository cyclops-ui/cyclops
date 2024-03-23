package telemetry

import (
	"github.com/google/uuid"
	"github.com/posthog/posthog-go"
)

type Client interface {
	ModuleCreation()
	ModuleReconciliation()
	InstanceStart()
}

type EnqueueClient struct {
	client     posthog.Client
	distinctID string
}

type MockClient struct{}

func NewClient(disable bool) (Client, error) {
	if disable {
		return MockClient{}, nil
	}

	client, err := posthog.NewWithConfig(
		"phc_1GSZ1j83eWbXITdpYO3u2Epo6ZZ7IimmRsLue7oDx3p",
		posthog.Config{
			Endpoint: "https://eu.posthog.com",
		},
	)
	if err != nil {
		return nil, err
	}

	id, err := uuid.NewUUID()
	if err != nil {
		return nil, err
	}

	return EnqueueClient{
		client:     client,
		distinctID: id.String(),
	}, nil
}

func (c EnqueueClient) InstanceStart() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "cyclops-instance-start",
		DistinctId: c.distinctID,
	})
}

func (c EnqueueClient) ModuleReconciliation() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "module-reconciliation",
		DistinctId: c.distinctID,
	})
}

func (c EnqueueClient) ModuleCreation() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "module-creation",
		DistinctId: c.distinctID,
	})
}

func (c MockClient) InstanceStart() {
}

func (c MockClient) ModuleReconciliation() {
}

func (c MockClient) ModuleCreation() {
}

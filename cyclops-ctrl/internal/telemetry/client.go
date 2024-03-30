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

type logger interface {
	Info(string, ...any)
	Error(error, string, ...any)
}

type EnqueueClient struct {
	client     posthog.Client
	distinctID string
}

type MockClient struct{}

func NewClient(disable bool, logger logger) (Client, error) {
	if disable {
		logger.Info("telemetry disabled")
		return MockClient{}, nil
	}

	client, err := posthog.NewWithConfig(
		"phc_1GSZ1j83eWbXITdpYO3u2Epo6ZZ7IimmRsLue7oDx3p",
		posthog.Config{
			Endpoint: "https://eu.posthog.com",
		},
	)
	if err != nil {
		logger.Error(err, "error starting telemetry")
		return nil, err
	}

	id, err := uuid.NewUUID()
	if err != nil {
		logger.Error(err, "error creating UUID")
		return nil, err
	}

	idStr := id.String()

	logger.Info("starting instance with UUID", "UUID", idStr)

	return EnqueueClient{
		client:     client,
		distinctID: idStr,
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

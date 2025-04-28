package telemetry

import (
	"github.com/google/uuid"
	"github.com/posthog/posthog-go"
)

type Client interface {
	ModuleCreation()
	ModuleReconciliation()
	MCPModuleReconciliation()
	InstanceStart()
	ReleaseUpdate()
	ReleaseMigration()
	TemplateCreation()
	TemplateEdit()
}

type logger interface {
	Info(string, ...any)
	Error(error, string, ...any)
}

type EnqueueClient struct {
	client         posthog.Client
	distinctID     string
	version        string
	installManager string
}

type MockClient struct{}

func NewClient(disable bool, version, installManager string, logger logger) (Client, error) {
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
		client:         client,
		distinctID:     idStr,
		version:        version,
		installManager: installManager,
	}, nil
}

func (c EnqueueClient) InstanceStart() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "cyclops-instance-start",
		DistinctId: c.distinctID,
		Properties: c.messageProps(),
	})
}

func (c EnqueueClient) ModuleReconciliation() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "module-reconciliation",
		DistinctId: c.distinctID,
		Properties: c.messageProps(),
	})
}

func (c EnqueueClient) MCPModuleReconciliation() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "mcp-module-reconciliation",
		DistinctId: c.distinctID,
		Properties: c.messageProps(),
	})
}

func (c EnqueueClient) ModuleCreation() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "module-creation",
		DistinctId: c.distinctID,
		Properties: c.messageProps(),
	})
}

func (c EnqueueClient) ReleaseUpdate() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "helm-release-upgrade",
		DistinctId: c.distinctID,
		Properties: c.messageProps(),
	})
}

func (c EnqueueClient) ReleaseMigration() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "helm-release-migration",
		DistinctId: c.distinctID,
		Properties: c.messageProps(),
	})
}

func (c EnqueueClient) TemplateCreation() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "template-creation",
		DistinctId: c.distinctID,
		Properties: c.messageProps(),
	})
}

func (c EnqueueClient) TemplateEdit() {
	_ = c.client.Enqueue(posthog.Capture{
		Event:      "template-edit",
		DistinctId: c.distinctID,
		Properties: c.messageProps(),
	})
}

func (c EnqueueClient) messageProps() map[string]interface{} {
	props := map[string]interface{}{
		"version": c.version,
	}

	if props != nil && len(c.installManager) != 0 {
		props["install_manager"] = c.installManager
	}

	return props
}

// region mock client

func (c MockClient) InstanceStart() {
}

func (c MockClient) ModuleReconciliation() {
}

func (c MockClient) MCPModuleReconciliation() {
}

func (c MockClient) ModuleCreation() {
}

func (c MockClient) ReleaseUpdate() {}

func (c MockClient) ReleaseMigration() {}

func (c MockClient) TemplateCreation() {}

func (c MockClient) TemplateEdit() {}

// endregion

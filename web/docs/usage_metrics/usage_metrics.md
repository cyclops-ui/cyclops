# Usage metrics

Cyclops tracks usage metrics so that the maintainers can gain better insights into Cyclops usage. No sensitive or user data is sent; only triggered events, like a Cyclops instance start, are sent.

These events include:

**- `cyclops-instance-start`** - triggered once at the start of cyclops-ctrl pod  
**- `module-creation`** - called by the UI each time you create a new module  
**- `module-reconciliation`** - each time a Module CRD in the cluster is changed  

The metric collection is implemented using [posthog](https://posthog.com).

Each time one of the events above is triggered, Cyclops sends an HTTP request to the posthog API with the following information:
```json
{
  "type": "capture",
  "timestamp": "2024-03-23T19:05:38.808279+01:00",
  "distinct_id": "f46d57f0-e93f-11ee-924c-8281c5d92ae4",
  "event": "cyclops-instance-start"
}
```
`distinct_id` - generated for each Cyclops instance using [NewUUID](https://pkg.go.dev/github.com/google/uuid#NewUUID) from google/uuid package  
`event` - which event was triggered; see events above

## Turn off

If you wish to turn off tracking metrics, add an environment variable to cyclops-ctrl:  
`DISABLE_TELEMETRY: true`

You can turn it off by adding the env variable to your `cyclops-ctrl` Deployment definition. Navigate to the `env` part of the deployment definition and add the following: 

```
env:
    - name: PORT
      value: "8080"
+   - name: DISABLE_TELEMETRY
+     value: "true"
```

The metric collection is enabled by default but is [disabled in development](https://github.com/cyclops-ui/cyclops/blob/main/cyclops-ctrl/.env).

## Other
If you have any additional questions about Cyclops and tracking usage metrics, reach out to us at `info@cyclops-ui.com`

# Configuration

Following are environment variables you can use to configure your instance of Cyclops. You can set those environment
variables directly on the `cyclops-ui` Kubernetes deployment.

### Cyclops controller

| Name                    | Description                                                                                                                                                                                                                                                       | Default value                 |
|:------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:------------------------------|
| PORT                    | Specify a port to expose the controller API                                                                                                                                                                                                                       | 8080                          |
| DISABLE_TELEMETRY       | By default, Cyclops controller emits usage metrics. If this env variable is set to `true`, the usage metrics are not exposed. You can read more about usage metrics [here](https://cyclops-ui.com/docs/usage_metrics/)                                            | false                         |
| WATCH_NAMESPACE         | Kubernetes namespace used for all Cyclops custom resources like `Modules`, `TemplateStores` and `TemplateAuthRules`. Cyclops is aware only of the custom resources in this namespace. Cyclops controller will not react to changes on Modules on other namespaces | cyclops                       |
| MODULE_TARGET_NAMESPACE | By default, Cyclops can manage resources created from Modules in the whole cluster. If this environment variables is set, Cyclops can manage Module child resources only in the namespace specified in the variable                                               | - (empty means cluster scope) |
| WATCH_NAMESPACE_HELM    | By default, Cyclops can list, get and upgrade Helm releases in the whole cluster. If this environment variables is set, Cyclops can manage releases and their resources only in the namespace specified in the variable                                           | - (empty means cluster scope) |

### Cyclops UI

| Name                        | Description                                                                                                                                                   | Default value                    |
|:----------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------|
| REACT_APP_CYCLOPS_CTRL_HOST | Host of your Cyclops controller                                                                                                                               | http://cyclops-ctrl.cyclops:8080 |
| REACT_APP_ENABLE_STREAMING  | Configures whether the Cyclops UI will subscribe to resource status SSE stream from cyclops controller. If `false`, resource status is polled each 15 seconds | true                             |

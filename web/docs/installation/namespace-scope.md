# Namespace scoped installation

By default, Cyclops allows you to manage your Kubernetes resources in your whole cluster. However, you can restrict Cyclops to resources in a single namespace to limit permissions needed for your Cyclops installation.

The next sections on permissions and configuration will discuss what changes need to be made to scope Cyclops to a namespace, and a section after that will explain how to do it in practice.

### Permissions

Since Cyclops queries Kubernetes resources on the Cluster scope, full cluster permissions are needed. In the [install manifest](https://github.com/cyclops-ui/cyclops/blob/main/install/cyclops-install.yaml), the `cyclops-ctrl` deployment uses a service account with a [ClusterRole](https://github.com/cyclops-ui/cyclops/blob/0da1cc5894512223ce08042ee766638c56a520a5/install/cyclops-install.yaml#L328) that allows all actions on all resources.

To limit permissions to a single namespace, you will need to replace the ClusterRole and ClusterRoleBinding with a Role and a RoleBinding, respectively, which will limit service account permissions to a single namespace.

### Cyclops controller configuration

By default, the Cyclops controller uses the cluster scope permissions for all resources and queries the Kubernetes API on the cluster level. If you limit its permissions to a single namespace, it will have insufficient rights, and calls to the Kubernetes API will fail.

Since version `v0.15.2`, Cyclops controller introduces environment variables that limit its querying capabilities to work within a single namespace instead of the whole cluster. These environment variables are used by the `cyclops-ctrl` deployment.

- `WATCH_NAMESPACE` - Kubernetes namespace used for all Cyclops custom resources like `Modules`, `TemplateStores` and `TemplateAuthRules`. Cyclops is aware only of the custom resources in this namespace. Cyclops controller will not react to changes on Modules in other namespaces
- `MODULE_TARGET_NAMESPACE` - By default, Cyclops can manage resources created from Modules in the whole cluster. If this environment variable is set, Cyclops can manage Module child resources only in the namespace specified in the variable
- `WATCH_NAMESPACE_HELM` - By default, Cyclops can list, get and upgrade Helm releases in the whole cluster. If this environment variable is set, Cyclops can manage releases and their resources only in the namespace specified in the variable

If you want to limit your Cyclops installation to a single namespace, you need to set the name of your namespace to all three of these environment variables. This will prevent Cyclops from querying on cluster scope and query only within the specified namespace.

## Updating Cyclops installation

You can change your installation resources manually by editing the [installation manifest](https://github.com/cyclops-ui/cyclops/blob/main/install/cyclops-install.yaml) or using our Helm chart.

You can generate all resources for a Cyclops installation with the following command and edit your Cyclops configuration manually from there:

```bash
helm template cyclops oci://registry-1.docker.io/cyclopsui/cyclops-chart \
--namespace <your-namespace> \
--include-crds \
--set global.singleNamespaceScope.enabled=true \
--set global.singleNamespaceScope.namespace=<your-namespace>
```

Alternatively, you can install Cyclops with `helm install`, but be aware that the Cyclops Helm release will be visible in the Cyclops UI under the Helm releases tab, which is something you might want to avoid. Because of this, we encourage you to generate resources using the `helm template` and apply them without using `helm install`.

:::info
If `global.singleNamespaceScope.enabled` is set to `true`, `global.singleNamespaceScope.namespace` needs to be set as well 
:::

The `helm template` command will produce a YAML manifest similar to the one in the installation manifest but with a couple of differences:

- All resources have the namespace set to the one you provided as `<your-namespace>`
- Instead of ClusterRole and ClusterRoleBindings, you can find a Role and a RoleBinding. The Role has all of the permissions but only within that namespace.

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1
    kind: Role
    metadata:
      labels:
        app.kubernetes.io/component: ctrl
        app.kubernetes.io/name: cyclops-ctrl
        app.kubernetes.io/part-of: cyclops
      name: cyclops-ctrl
      namespace: "my-namespace"
    rules:
      - apiGroups:
          - '*'
        resources:
          - '*'
        verbs:
          - '*'
    ---
    apiVersion: rbac.authorization.k8s.io/v1
    kind: RoleBinding
    metadata:
      labels:
        app.kubernetes.io/component: ctrl
        app.kubernetes.io/name: cyclops-ctrl
        app.kubernetes.io/part-of: cyclops
      name: cyclops-ctrl
      namespace: "my-namespace"
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: Role
      name: cyclops-ctrl
    subjects:
      - kind: ServiceAccount
        name: cyclops-ctrl
        namespace: "my-namespace"
    ```

- `cyclops-ctrl` deployment has all three of the mentioned environment variables set to `<your-namespace>`

    ```yaml
    ...
    - name: cyclops-ctrl
      image: cyclopsui/cyclops-ctrl:v0.15.2
      ports:
        - containerPort: 8080
      env:
        - name: PORT
          value: "8080"
        - name: WATCH_NAMESPACE
          value: "my-namespace"
        - name: MODULE_TARGET_NAMESPACE
          value: "my-namespace"
        - name: WATCH_NAMESPACE_HELM
          value: "my-namespace"
    ...
    ```

With the setup mentioned above, you can manage a single namespace through Cyclops, allowing for fewer permissions for your installation.

:::warning
**Non namespaced resources are not visible when Cyclops is installed with namespace scope!**

Currently, when Cyclops is scoped to a single namespace, it does not have permissions to resources that are not namespaced, such as Persistent volumes, Nodes, …

Because of that, once you set a namespace scoped installation and you go to the nodes tab, it will show an error saying it has insufficient permissions.

With a namespaced scoped installation, when editing Modules and Releases, Cyclops will fail creating/editing/deleting any non-namespaced resources.
:::

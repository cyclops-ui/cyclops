# Catalog plugin

Shows Cyclops module data as part of the Backstage catalog. This plugin allows you to add the page for Module details and edit your Modules through a new tab in your Component details page.

<img width="1496" alt="Screenshot 2024-12-23 at 13 59 50" src="https://github.com/user-attachments/assets/c4174393-1a2b-451e-ab6b-f39b52dbd1cb" />

You can view Kubernetes resources deployed for a Module (check status, list logs) as well as perform actions like reconciling Modules or restarting workloads.

If you click the `Edit` button, you will be able to see the UI for editing that specific Module.

<img width="1494" alt="Screenshot 2024-12-23 at 14 01 51" src="https://github.com/user-attachments/assets/76b554fd-ec88-4484-b2b9-d6ce25f6a2d2" />

Module plugin communicates with an existing Cyclops backend instance running in your cluster. All requests going from your Backstage app to the Cyclops backend are proxied through the Backstage backend, so all of the requests are authenticated.

By default, the Module plugin will fetch the Module called the same as the component. In this case, the component is called `example-website`, and the Cyclops plugin will fetch a Module called `example-website`.

In case your Module is called differently from the Backstage component, you can set the `cyclops-ui.com/module-name-override` annotation that would override the Module fetched for your component. In the example below, the component is called `my-component`, but the Module that would be fetched is the `demo-module`.

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-component
  annotations:
    cyclops-ui.com/module-name-override: demo-module # specify which Cyclops module should be fetched
spec:
  type: website
  lifecycle: experimental
  owner: guests
  system: examples
  providesApis: [example-grpc-api]
```

### Install
Steps for setting up the plugin on your Backstage app:

1. Have a running Cyclops instance:
    - If you don't have a running instance, you can install one by following [this two-command tutorial](https://cyclops-ui.com/docs/installation/install/manifest/)
    - Make sure that Cyclops backend (`cyclops-ctrl` pod) is running and is reachable. If you installed with the commands above, your Cyclops instance would be reachable from within the same Kubernetes cluster on `http://cyclops-ctrl.cyclops:8080`
2. Add the plugin to your Backstage instance, you need to add to `packages/app`:

    ```bash
    yarn --cwd packages/app add @cyclopsui/backstage-plugin-cyclops-modules
    ```

3. Add proxy configuration to your Backstage configuration in `app-config.yaml`

    ```yaml
    proxy:
      endpoints:
        '/cyclops':
          target: 'http://cyclops-ctrl.cyclops:8080'
          changeOrigin: true
    ```

4. Add Module plugin component to your catalog. Go to file `packages/app/src/components/catalog/EntityPage.tsx` and import Cyclops component:

    ```tsx
    import {ModuleDetailsComponent} from "@cyclopsui/backstage-plugin-cyclops-modules";
    ```

   Now you just need to add the Cyclops component to the entity. For example, if you want to add Cyclops tab for a Website component, find `websiteEntityPage` and the Cyclops tab by pasting the code below:

    ```tsx
    <EntityLayout.Route path={"/cyclops"} title={"Cyclops"}>
    	<ModuleDetailsComponent/>
    </EntityLayout.Route>
    ```


Your Backstage catalog can now view and edit deployed Modules in your cluster.

This plugin can't deploy new Modules and can only give you an overview of existing ones.

The backstage plugin subscribes to the SSE on the Cyclops API to have live data about deployed Kubernetes resources. If you want to turn off streaming and fallback to polling, you can add the following to the `app-config.yaml`:
```yaml
cyclops:
  streamingDisabled: true
```
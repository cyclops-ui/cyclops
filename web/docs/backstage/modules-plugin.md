# Modules plugin

Lists all Cyclops modules on `/cyclops` so all of the modules can be viewed in a single page. Each module can then be selected and managed separately.

<img width="1512" alt="Screenshot 2025-01-20 at 20 09 23" src="https://github.com/user-attachments/assets/2df56370-5af7-44d9-8f08-de3a509503fb" />

You can create a new Module by clicking the `Add module` button in the top right corner, which will allow you to select a template and enter the configuration through the UI. Once a module is created, you can check its resources and see it on the list above.

Each module can be selected by clicking on its name to list Kubernetes resources deployed for a particular module or to further edit the module.

<img width="1512" alt="Screenshot 2025-01-20 at 20 11 56" src="https://github.com/user-attachments/assets/a6ae8cad-1075-42d3-b725-bc9d9dd046fb" />

Through this page, you can view or edit your Kubernetes resources and the module.

### Install

Steps for setting up the plugin on your Backstage app:

1. Have a running Cyclops instance:
    - If you don't have a running instance, you can install one by following [this two-command tutorial](https://cyclops-ui.com/docs/installation/install/manifest/)
    - Make sure that Cyclops backend (`cyclops-ctrl` pod) is running and is reachable. If you installed with the commands above, your Cyclops instance would be reachable from within the same Kubernetes cluster on `http://cyclops-ctrl.cyclops:8080`
2. Add the plugin to your Backstage instance; you need to add to `packages/app`:

    ```bash
    yarn --cwd packages/app add @cyclopsui/backstage-plugin-cyclops
    ```

3. Add proxy configuration to your Backstage configuration in `app-config.yaml`

    ```yaml
    proxy:
      endpoints:
        '/cyclops':
          target: 'http://cyclops-ctrl.cyclops:8080'
          changeOrigin: true
    ```

4. Register routes in `packages/app/src/App.tsx`

    ```tsx
    import {CyclopsModulePage, CyclopsPage} from '@cyclopsui/backstage-plugin-cyclops';
    
    const routes = (
      <FlatRoutes>
        ...
        <Route path="/cyclops" element={<CyclopsPage />} />
        <Route path="/cyclops/:moduleName" element={<CyclopsModulePage />} />
        ...
      </FlatRoutes>
    );
    ```

5. Add the plugin button to the sidebar. In file `packages/app/src/components/Root/Root.tsx`

    ```tsx
    export const Root = ({ children }: PropsWithChildren<{}>) => (
      <SidebarPage>
        ...
            <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
            <SidebarItem icon={LibraryBooks} to="cyclops" text="Modules" />
        ...
      </SidebarPage>
    );
    ```

You should now be able to see the sidebar button leading you to the list of modules, as shown in the image above.

The backstage plugin subscribes to the SSE on the Cyclops API to have live data about deployed Kubernetes resources. If you want to turn off streaming and fallback to polling, you can add the following to the `app-config.yaml`:
```yaml
cyclops:
  streamingDisabled: true
```

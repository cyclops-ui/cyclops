import React, { createContext, ReactNode, useContext } from "react";

interface ModuleDetailsActionsContextType {
  name: string;
  streamingDisabled: boolean;
  fetchModule: (moduleName: string) => Promise<any>;
  fetchModuleRawManifest: (moduleName: string) => Promise<string>;
  fetchModuleRenderedManifest: (moduleName: string) => Promise<string>;
  reconcileModule: (moduleName: string) => Promise<any>;
  deleteModule: (moduleName: string) => Promise<any>;
  fetchModuleResources: (moduleName: string) => Promise<any[]>;
  fetchResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => () => Promise<any>;
  fetchResourceManifest: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
    includeManagedFields: boolean,
  ) => Promise<string>;
  resourceStreamImplementation?: (
    path: string,
    setResource: (any) => void,
  ) => void;
  restartResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => Promise<boolean>;
  deleteResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => Promise<boolean>;
  getPodLogs?: (
    namespace: string,
    name: string,
    container: string,
  ) => Promise<string[]>;
  downloadPodLogs?: (
    namespace: string,
    name: string,
    container: string,
  ) => void;
  streamPodLogs?: (
    namespace: string,
    name: string,
    container: string,
    setLog: (log: string, isReset?: boolean) => void,
    setError: (err: Error, isReset?: boolean) => void,
    signalController: AbortController,
  ) => void;
}

const ModuleDetailsActionsContext = createContext<
  ModuleDetailsActionsContextType | undefined
>(undefined);

interface ModuleDetailsActionsProviderProps {
  name: string;
  streamingDisabled: boolean;
  fetchModule: (moduleName: string) => Promise<any>;
  fetchModuleRawManifest: (moduleName: string) => Promise<string>;
  fetchModuleRenderedManifest: (moduleName: string) => Promise<string>;
  reconcileModule: (moduleName: string) => Promise<any>;
  deleteModule: (moduleName: string) => Promise<any>;
  fetchModuleResources: (moduleName: string) => Promise<any[]>;
  fetchResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => () => Promise<any>;
  fetchResourceManifest: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
    includeManagedFields: boolean,
  ) => Promise<string>;
  resourceStreamImplementation?: (
    path: string,
    setResource: (any) => void,
  ) => void;
  restartResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => Promise<boolean>;
  deleteResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => Promise<boolean>;
  getPodLogs?: (
    namespace: string,
    name: string,
    container: string,
  ) => Promise<string[]>;
  downloadPodLogs?: (
    namespace: string,
    name: string,
    container: string,
  ) => void;
  streamPodLogs?: (
    namespace: string,
    name: string,
    container: string,
    setLog: (log: string, isReset?: boolean) => void,
    setError: (err: Error, isReset?: boolean) => void,
    signalController: AbortController,
  ) => void;
  children: ReactNode;
}

export const ModuleDetailsActionsProvider: React.FC<
  ModuleDetailsActionsProviderProps
> = ({
  name,
  streamingDisabled,
  fetchModule,
  fetchModuleRawManifest,
  fetchModuleRenderedManifest,
  reconcileModule,
  deleteModule,
  fetchModuleResources,
  fetchResource,
  fetchResourceManifest,
  resourceStreamImplementation,
  restartResource,
  deleteResource,
  getPodLogs,
  downloadPodLogs,
  streamPodLogs,
  children,
}) => {
  return (
    <ModuleDetailsActionsContext.Provider
      value={{
        name,
        streamingDisabled,
        fetchModule,
        fetchModuleRawManifest,
        fetchModuleRenderedManifest,
        reconcileModule,
        deleteModule,
        fetchModuleResources,
        fetchResource,
        fetchResourceManifest,
        resourceStreamImplementation,
        restartResource,
        deleteResource,
        getPodLogs,
        downloadPodLogs,
        streamPodLogs,
      }}
    >
      {children}
    </ModuleDetailsActionsContext.Provider>
  );
};

export const useModuleDetailsActions = (): ModuleDetailsActionsContextType => {
  const context = useContext(ModuleDetailsActionsContext);
  if (!context) {
    throw new Error(
      "useModuleDetailsActions must be used within a FetchFunctionsProvider",
    );
  }
  return context;
};

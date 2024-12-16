import React, { createContext, ReactNode, useContext } from "react";

interface ResourceListActionsContextType {
  themePalette?: "dark" | "light";
  streamingDisabled: boolean;
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

const ResourceListActionsContext = createContext<
  ResourceListActionsContextType | undefined
>(undefined);

interface ResourceListActionsProviderProps {
  themePalette?: "dark" | "light";
  streamingDisabled: boolean;
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

export const ResourceListActionsProvider: React.FC<
  ResourceListActionsProviderProps
> = ({
  themePalette,
  streamingDisabled,
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
    <ResourceListActionsContext.Provider
      value={{
        themePalette,
        streamingDisabled,
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
    </ResourceListActionsContext.Provider>
  );
};

export const useResourceListActions = (): ResourceListActionsContextType => {
  const context = useContext(ResourceListActionsContext);
  if (!context) {
    throw new Error(
      "useResourceListActions must be used within a ResourceListActionsProvider",
    );
  }
  return context;
};

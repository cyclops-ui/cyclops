import React, { useMemo, useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Position,
  NodeMouseHandler,
} from "reactflow";
import dagre from "dagre";
import {
  Drawer,
  Button,
  Row,
  Col,
  Tooltip,
  Modal,
  Alert,
  Spin,
  Tag,
  Descriptions,
  Divider,
  Checkbox,
  Input,
  Popover,
  Space,
  Badge,
} from "antd";
import {
  FileTextOutlined,
  UndoOutlined,
  DeleteOutlined,
  CloseOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import ReactAce from "react-ace";
import "reactflow/dist/style.css";
import "./ResourceTree.css";
import { useResourceListActions } from "../ResourceList/ResourceListActionsContext";
import { ResourceRef, resourceRefKey } from "../../../utils/resourceRef";
import { Workload } from "../../../utils/k8s/workload";
import { mapResponseError } from "../../../utils/api/errors";
import { canRestart } from "../common/RestartButton";
import { useTheme } from "../../theme/ThemeContext";

import Deployment from "../Deployment";
import StatefulSet from "../StatefulSet";
import DaemonSet from "../DaemonSet";
import CronJob from "../CronJob";
import Job from "../Job";
import Service from "../Service";
import ConfigMap from "../ConfigMap";
import Secret from "../Secret";
import PersistentVolumeClaim from "../PersistentVolumeClaim";
import Role from "../Role";
import ClusterRole from "../ClusterRole";
import NetworkPolicy from "../NetworkPolicy";

interface Resource {
  group: string;
  version: string;
  kind: string;
  name: string;
  namespace: string;
  status?: string;
  deleted?: boolean;
  missing?: boolean;
}

interface ContainerData {
  name: string;
  image: string;
  env?: Record<string, string>;
  status?: {
    status: string;
    message?: string;
    running: boolean;
  };
}

interface PodData {
  group?: string;
  version?: string;
  kind?: string;
  name: string;
  namespace: string;
  status?: boolean;
  podPhase?: string;
  node?: string;
  started?: string;
  containers?: ContainerData[];
  initContainers?: ContainerData[];
}

interface WorkloadDetails {
  pods?: PodData[];
  status?: string;
}

interface ResourceTreeProps {
  resources: Resource[];
  workloads: Map<string, Workload>;
  onResourceDelete: () => void;
}

const nodeWidth = 180;
const nodeHeight = 60;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const getStatusColor = (status?: string): string => {
  switch (status) {
    case "healthy":
      return "#52c41a";
    case "progressing":
      return "#faad14";
    case "unhealthy":
      return "#ff4d4f";
    default:
      return "#d9d9d9";
  }
};

const isWorkload = (resource: Resource): boolean => {
  return (
    (resource.group === "apps" &&
      resource.version === "v1" &&
      (resource.kind === "Deployment" ||
        resource.kind === "StatefulSet" ||
        resource.kind === "DaemonSet")) ||
    (resource.group === "batch" &&
      resource.version === "v1" &&
      resource.kind === "CronJob")
  );
};

const ResourceTree: React.FC<ResourceTreeProps> = ({
  resources,
  workloads,
  onResourceDelete
}) => {
  const {
    fetchResource,
    fetchResourceManifest,
    restartResource,
    deleteResource,
  } = useResourceListActions();

  const { mode } = useTheme();

  const [workloadDetails, setWorkloadDetails] = useState<Map<string, WorkloadDetails>>(new Map());
  const [loadingWorkloads, setLoadingWorkloads] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedPod, setSelectedPod] = useState<PodData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [manifestModal, setManifestModal] = useState({
    on: false,
    resource: {
      group: "",
      version: "",
      kind: "",
      name: "",
      namespace: "",
    },
    manifest: "",
  });
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [showManagedFields, setShowManagedFields] = useState(false);

  const [deleteResourceModal, setDeleteResourceModal] = useState(false);
  const [deleteResourceRef, setDeleteResourceRef] = useState<ResourceRef>({
    group: "",
    version: "",
    kind: "",
    name: "",
    namespace: "",
  });
  const [deleteResourceVerify, setDeleteResourceVerify] = useState("");
  const [deletingResource, setDeletingResource] = useState(false);

  const [resourceFilter, setResourceFilter] = useState<string[]>([]);

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    let isMounted = true;

    // Fetch details for all workloads
    const fetchWorkloadDetails = async () => {
      // Don't refetch if drawer is open to prevent flickering
      if (drawerOpen) {
        return;
      }

      setLoadingWorkloads(true);
      const detailsMap = new Map<string, WorkloadDetails>();

      for (const resource of resources) {
        if (isWorkload(resource)) {
          try {
            const details = await fetchResource(
              resource.group,
              resource.version,
              resource.kind,
              resource.namespace,
              resource.name
            )();
            const key = `${resource.kind}-${resource.namespace}-${resource.name}`;
            detailsMap.set(key, details);
          } catch (error) {
            console.error("Error fetching workload details:", error);
          }
        }
      }

      if (isMounted) {
        setWorkloadDetails(detailsMap);
        setLoadingWorkloads(false);
      }
    };

    fetchWorkloadDetails();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources, drawerOpen]);

  const availableKinds = useMemo(() => {
    const kinds = new Set<string>();
    resources.forEach(r => kinds.add(r.kind));
    workloadDetails.forEach((details) => {
      if (details.pods) {
        kinds.add("Pod");
      }
    });
    return Array.from(kinds).sort();
  }, [resources, workloadDetails]);

  const filteredResources = useMemo(() => {
    if (resourceFilter.length === 0) {
      return resources;
    }
    return resources.filter(r => resourceFilter.includes(r.kind));
  }, [resources, resourceFilter]);

  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    filteredResources.forEach((resource) => {
      const nodeId = `${resource.kind}-${resource.namespace}-${resource.name}`;

      flowNodes.push({
        id: nodeId,
        type: "default",
        data: {
          label: (
            <div className="resource-node">
              <div className="resource-node-kind">{resource.kind}</div>
              <div className="resource-node-name">{resource.name}</div>
            </div>
          ),
          resource: resource,
        },
        position: { x: 0, y: 0 },
        style: {
          background: "#fff",
          border: `2px solid ${getStatusColor(resource.status)}`,
          borderRadius: "8px",
          padding: "10px",
          width: nodeWidth,
          fontSize: "12px",
          cursor: "pointer",
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      if (isWorkload(resource)) {
        const key = `${resource.kind}-${resource.namespace}-${resource.name}`;
        const details = workloadDetails.get(key);

        if (details?.pods && Array.isArray(details.pods)) {
          details.pods.forEach((pod: PodData) => {
            if (resourceFilter.length > 0 && !resourceFilter.includes("Pod")) {
              return;
            }

            const podNamespace = pod.namespace || resource.namespace;
            const podId = `Pod-${podNamespace}-${pod.name}`;

            let podStatus = "unhealthy";
            if (pod.status === true || pod.podPhase === "Running") {
              podStatus = "healthy";
            } else if (pod.podPhase === "Pending" || pod.podPhase === "ContainerCreating") {
              podStatus = "progressing";
            }

            const podData: PodData = {
              ...pod,
              namespace: podNamespace,
            };

            flowNodes.push({
              id: podId,
              type: "default",
              data: {
                label: (
                  <div className="resource-node">
                    <div className="resource-node-kind">Pod</div>
                    <div className="resource-node-name">{pod.name}</div>
                  </div>
                ),
                pod: podData,
              },
              position: { x: 0, y: 0 },
              style: {
                background: "#fff",
                border: `2px solid ${getStatusColor(podStatus)}`,
                borderRadius: "8px",
                padding: "10px",
                width: nodeWidth,
                fontSize: "12px",
                cursor: "pointer",
              },
              sourcePosition: Position.Bottom,
              targetPosition: Position.Top,
            });

            flowEdges.push({
              id: `${nodeId}-${podId}`,
              source: nodeId,
              target: podId,
              type: "smoothstep",
              animated: false,
              style: {
                stroke: "#1890ff",
                strokeWidth: 2,
              },
            });
          });
        }
      }
    });

    return getLayoutedElements(flowNodes, flowEdges);
  }, [filteredResources, workloadDetails, resourceFilter]);

  const getWorkload = (ref: ResourceRef): Workload | undefined => {
    let k = resourceRefKey(ref);
    return workloads.get(k);
  };

  const onNodeClick: NodeMouseHandler = (event, node) => {
    if (node.data.resource) {
      setSelectedResource(node.data.resource);
      setSelectedPod(null);
      setDrawerOpen(true);
    } else if (node.data.pod) {
      const podData = { ...node.data.pod };
      if (!podData.namespace || podData.namespace === "") {
        console.warn("Pod namespace is missing, using 'default'");
        podData.namespace = "default";
      }
      setSelectedPod(podData);
      setSelectedResource(null);
      setDrawerOpen(true);
    }
  };

  const fetchManifest = useCallback(
    (
      group: string,
      version: string,
      kind: string,
      namespace: string,
      name: string,
      showManagedFields: boolean,
    ) => {
      setLoadingManifest(true);
      fetchResourceManifest(
        group,
        version,
        kind,
        namespace,
        name,
        showManagedFields,
      )
        .then((res) => {
          setManifestModal((prev) => ({
            ...prev,
            manifest: res,
          }));
          setLoadingManifest(false);
        })
        .catch((error) => {
          const errorDetails = mapResponseError(error);
          setError({
            message: "Failed to fetch manifest",
            description: errorDetails.description || "Unable to retrieve resource manifest. Please try again.",
          });
          setLoadingManifest(false);
        });
    },
    [fetchResourceManifest]
  );

  const handleViewManifest = async (resource: Resource) => {
    try {
      setError({ message: "", description: "" });
      setShowManagedFields(false);

      setManifestModal({
        on: true,
        resource: resource,
        manifest: "",
      });

      fetchManifest(
        resource.group,
        resource.version,
        resource.kind,
        resource.namespace,
        resource.name,
        false,
      );
    } catch (err: any) {
      const errorDetails = mapResponseError(err);
      setError({
        message: "Failed to open manifest",
        description: errorDetails.description || "Unable to open manifest modal. Please try again.",
      });
    }
  };

  const handleManagedFieldsChange = (checked: boolean) => {
    setShowManagedFields(checked);
    fetchManifest(
      manifestModal.resource.group,
      manifestModal.resource.version,
      manifestModal.resource.kind,
      manifestModal.resource.namespace,
      manifestModal.resource.name,
      checked,
    );
  };

  const handleRestartResource = async (resource: Resource) => {
    try {
      setError({ message: "", description: "" });
      await restartResource(
        resource.group,
        resource.version,
        resource.kind,
        resource.namespace,
        resource.name
      );
      window.location.reload();
    } catch (err: any) {
      const errorDetails = mapResponseError(err);
      setError({
        message: "Failed to restart resource",
        description: errorDetails.description || "Unable to restart the resource. Please try again.",
      });
    }
  };

  const confirmDeleteResource = (resource: Resource) => {
    setDeleteResourceRef(resource);
    setDeleteResourceVerify("");
    setDeleteResourceModal(true);
  };

  const handleDeleteResource = async () => {
    if (deleteResourceVerify !== deleteResourceRef.name) {
      setError({
        message: "Verification failed",
        description: "Please type the resource name correctly to confirm deletion.",
      });
      return;
    }

    try {
      setDeletingResource(true);
      setError({ message: "", description: "" });

      await deleteResource(
        deleteResourceRef.group,
        deleteResourceRef.version,
        deleteResourceRef.kind,
        deleteResourceRef.namespace,
        deleteResourceRef.name
      );

      setDeleteResourceModal(false);
      setDeleteResourceVerify("");
      setDrawerOpen(false);
      onResourceDelete();
    } catch (err: any) {
      const errorDetails = mapResponseError(err);
      setError({
        message: "Failed to delete resource",
        description: errorDetails.description || "Unable to delete the resource. Please try again.",
      });
    } finally {
      setDeletingResource(false);
    }
  };

  const handleCancelDeleteResource = () => {
    setDeleteResourceModal(false);
    setDeleteResourceRef({
      group: "",
      version: "",
      kind: "",
      name: "",
      namespace: "",
    });
    setDeleteResourceVerify("");
  };

  const renderResourceDetails = (resource: Resource) => {
    let resourceRef: ResourceRef = {
      group: resource.group,
      version: resource.version,
      kind: resource.kind,
      name: resource.name,
      namespace: resource.namespace,
    };

    switch (true) {
      case resource.group === "apps" &&
        resource.version === "v1" &&
        resource.kind === "Deployment":
        return (
          <Deployment
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
      case resource.group === "batch" &&
        resource.version === "v1" &&
        resource.kind === "CronJob":
        return (
          <CronJob name={resource.name} namespace={resource.namespace} />
        );
      case resource.group === "batch" &&
        resource.version === "v1" &&
        resource.kind === "Job":
        return <Job name={resource.name} namespace={resource.namespace} />;
      case resource.group === "apps" &&
        resource.version === "v1" &&
        resource.kind === "DaemonSet":
        return (
          <DaemonSet
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
      case resource.group === "apps" &&
        resource.version === "v1" &&
        resource.kind === "StatefulSet":
        return (
          <StatefulSet
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "Service":
        return <Service name={resource.name} namespace={resource.namespace} />;
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "ConfigMap":
        return (
          <ConfigMap name={resource.name} namespace={resource.namespace} />
        );
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "Secret":
        return <Secret name={resource.name} namespace={resource.namespace} />;
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "PersistentVolumeClaim":
        return (
          <PersistentVolumeClaim
            name={resource.name}
            namespace={resource.namespace}
          />
        );
      case resource.group === "rbac.authorization.k8s.io" &&
        resource.version === "v1" &&
        resource.kind === "Role":
        return <Role name={resource.name} namespace={resource.namespace} />;
      case resource.group === "rbac.authorization.k8s.io" &&
        resource.version === "v1" &&
        resource.kind === "ClusterRole":
        return <ClusterRole name={resource.name} />;
      case resource.group === "networking.k8s.io" &&
        resource.version === "v1" &&
        resource.kind === "NetworkPolicy":
        return (
          <NetworkPolicy name={resource.name} namespace={resource.namespace} />
        );
      default:
        return (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Group">{resource.group || "core"}</Descriptions.Item>
            <Descriptions.Item label="Version">{resource.version}</Descriptions.Item>
            <Descriptions.Item label="Kind">{resource.kind}</Descriptions.Item>
            <Descriptions.Item label="Namespace">{resource.namespace}</Descriptions.Item>
            <Descriptions.Item label="Name">{resource.name}</Descriptions.Item>
          </Descriptions>
        );
    }
  };

  const renderPodStatus = (pod: PodData) => {
    if (pod.podPhase === "Running") {
      return <Tag icon={<CheckCircleOutlined />} color="success">Healthy</Tag>;
    } else if (pod.podPhase === "Pending") {
      return <Tag icon={<SyncOutlined spin />} color="processing">Pending</Tag>;
    } else {
      return <Tag icon={<CloseCircleOutlined />} color="error">Unhealthy</Tag>;
    }
  };

  const renderFilterPopover = () => (
    <div style={{ width: 250 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Filter by Resource Kind</div>
      <Checkbox.Group
        options={availableKinds.map(kind => ({ label: kind, value: kind }))}
        value={resourceFilter}
        onChange={(values) => setResourceFilter(values as string[])}
        style={{ display: 'flex', flexDirection: 'column' }}
      />
      {resourceFilter.length > 0 && (
        <Button
          size="small"
          type="link"
          onClick={() => setResourceFilter([])}
          style={{ marginTop: 8, padding: 0 }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  const renderLegend = () => (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12, fontWeight: 600 }}>Resource Status Legend</div>
      <Space direction="vertical" size="small">
        <div>
          <Badge color="#52c41a" text="Healthy - Resource is running normally" />
        </div>
        <div>
          <Badge color="#faad14" text="Progressing - Resource is starting or updating" />
        </div>
        <div>
          <Badge color="#ff4d4f" text="Unhealthy - Resource has errors" />
        </div>
        <div>
          <Badge color="#d9d9d9" text="Unknown - Status not available" />
        </div>
      </Space>
      <Divider style={{ margin: "12px 0" }} />
      <div style={{ fontSize: 12, color: "#8c8c8c" }}>
        Click on any resource to view details. Use the controls below to zoom and pan.
      </div>
    </div>
  );

  if (resources.length === 0) {
    return (
      <div className="resource-tree-empty">
        <InfoCircleOutlined style={{ fontSize: "24px", marginBottom: "8px", color: "#8c8c8c" }} />
        <p>No resources to display</p>
      </div>
    );
  }

  if (loadingWorkloads) {
    return (
      <div className="resource-tree-empty">
        <Spin size="large" />
        <p style={{ marginTop: "16px" }}>Loading resource tree...</p>
      </div>
    );
  }

  return (
    <>
      {error.message.length !== 0 && (
        <Alert
          message={error.message}
          description={error.description}
          type="error"
          closable
          showIcon
          afterClose={() => {
            setError({
              message: "",
              description: "",
            });
          }}
          style={{ marginBottom: "20px" }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <Popover content={renderFilterPopover()} title="Filter Resources" trigger="click">
            <Badge count={resourceFilter.length} offset={[-5, 5]}>
              <Button icon={<FilterOutlined />}>
                Filter {resourceFilter.length > 0 && `(${resourceFilter.length})`}
              </Button>
            </Badge>
          </Popover>
        </Col>
        <Col>
          <Popover content={renderLegend()} title="Help" trigger="click">
            <Button icon={<QuestionCircleOutlined />}>
              Legend
            </Button>
          </Popover>
        </Col>
        <Col flex="auto" style={{ textAlign: "right", color: "#8c8c8c", lineHeight: "32px" }}>
          {nodes.length} resource{nodes.length !== 1 ? "s" : ""} displayed
        </Col>
      </Row>

      <div className="resource-tree-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.1}
          maxZoom={1.5}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              return node.style?.border?.toString().split(" ")[2] || "#d9d9d9";
            }}
          />
        </ReactFlow>
      </div>

      <Drawer
        title={
          <Row gutter={[8, 8]} align="middle">
            <Col>
              <span style={{ fontSize: "18px", fontWeight: 600 }}>
                {selectedResource?.name || selectedPod?.name}
              </span>
            </Col>
            <Col>
              {selectedResource && (
                <Tag color="blue">{selectedResource.kind}</Tag>
              )}
              {selectedPod && <Tag color="green">Pod</Tag>}
            </Col>
          </Row>
        }
        placement="right"
        onClose={() => {
          setDrawerOpen(false);
          setSelectedResource(null);
          setSelectedPod(null);
        }}
        open={drawerOpen}
        width="60%"
        closeIcon={<CloseOutlined />}
        extra={
          <>
            {selectedResource && (
              <Row gutter={[8, 8]}>
                <Col>
                  <Tooltip title="View Manifest">
                    <Button
                      icon={<FileTextOutlined />}
                      onClick={() => handleViewManifest(selectedResource)}
                      loading={loadingManifest}
                    >
                      Manifest
                    </Button>
                  </Tooltip>
                </Col>
                {canRestart(
                  selectedResource.group,
                  selectedResource.version,
                  selectedResource.kind
                ) && (
                  <Col>
                    <Tooltip title="Restart">
                      <Button
                        icon={<UndoOutlined />}
                        onClick={() => handleRestartResource(selectedResource)}
                      >
                        Restart
                      </Button>
                    </Tooltip>
                  </Col>
                )}
                <Col>
                  <Tooltip title="Delete">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => confirmDeleteResource(selectedResource)}
                    >
                      Delete
                    </Button>
                  </Tooltip>
                </Col>
              </Row>
            )}
            {selectedPod && (
              <Row gutter={[8, 8]}>
                <Col>
                  <Tooltip title="View Manifest">
                    <Button
                      icon={<FileTextOutlined />}
                      onClick={() => {
                        const namespace = selectedPod.namespace || "default";
                        handleViewManifest({
                          group: "",
                          version: "v1",
                          kind: "Pod",
                          name: selectedPod.name,
                          namespace: namespace,
                        });
                      }}
                      loading={loadingManifest}
                    >
                      Manifest
                    </Button>
                  </Tooltip>
                </Col>
                <Col>
                  <Tooltip title="Delete Pod">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        const namespace = selectedPod.namespace || "default";
                        confirmDeleteResource({
                          group: "",
                          version: "v1",
                          kind: "Pod",
                          name: selectedPod.name,
                          namespace: namespace,
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </Tooltip>
                </Col>
              </Row>
            )}
          </>
        }
      >
        {selectedResource && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: "20px" }}>
              <Descriptions.Item label="Namespace" span={2}>
                <Tooltip title="Click to copy">
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      navigator.clipboard.writeText(selectedResource.namespace);
                    }}
                  >
                    {selectedResource.namespace}{" "}
                    <CopyOutlined style={{ fontSize: "12px", color: "#1890ff" }} />
                  </span>
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="Kind">{selectedResource.kind}</Descriptions.Item>
              <Descriptions.Item label="Version">{selectedResource.version}</Descriptions.Item>
              {selectedResource.group && (
                <Descriptions.Item label="Group" span={2}>{selectedResource.group}</Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            {renderResourceDetails(selectedResource)}
          </div>
        )}
        {selectedPod && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: "20px" }}>
              <Descriptions.Item label="Namespace" span={2}>
                {selectedPod.namespace || "default"}
              </Descriptions.Item>
              <Descriptions.Item label="Phase">
                {selectedPod.podPhase || "Unknown"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {renderPodStatus(selectedPod)}
              </Descriptions.Item>
              {selectedPod.node && (
                <Descriptions.Item label="Node" span={2}>
                  {selectedPod.node}
                </Descriptions.Item>
              )}
              {selectedPod.started && (
                <Descriptions.Item label="Started" span={2}>
                  {new Date(selectedPod.started).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedPod.containers && selectedPod.containers.length > 0 && (
              <>
                <Divider orientation="left">Containers ({selectedPod.containers.length})</Divider>
                {selectedPod.containers.map((container, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "16px",
                      background: mode === "dark" ? "#1f1f1f" : "#fafafa",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      border: `1px solid ${mode === "dark" ? "#333" : "#e0e0e0"}`,
                    }}
                  >
                    <Descriptions bordered column={1} size="small" title={container.name}>
                      <Descriptions.Item label="Image">
                        <code style={{ fontSize: "12px", wordBreak: "break-all" }}>
                          {container.image}
                        </code>
                      </Descriptions.Item>
                      {container.status && (
                        <Descriptions.Item label="Status">
                          <Tag color={container.status.running ? "success" : "error"}>
                            {container.status.status}
                          </Tag>
                          {container.status.message && (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "#8c8c8c" }}>
                              {container.status.message}
                            </div>
                          )}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                ))}
              </>
            )}

            {selectedPod.initContainers && selectedPod.initContainers.length > 0 && (
              <>
                <Divider orientation="left">Init Containers ({selectedPod.initContainers.length})</Divider>
                {selectedPod.initContainers.map((container, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "16px",
                      background: mode === "dark" ? "#1f1f1f" : "#fafafa",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      border: `1px solid ${mode === "dark" ? "#333" : "#e0e0e0"}`,
                    }}
                  >
                    <Descriptions bordered column={1} size="small" title={container.name}>
                      <Descriptions.Item label="Image">
                        <code style={{ fontSize: "12px", wordBreak: "break-all" }}>
                          {container.image}
                        </code>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title={
          <Row justify="space-between" align="middle">
            <Col>Resource Manifest</Col>
            <Col>
              <Checkbox
                checked={showManagedFields}
                onChange={(e) => handleManagedFieldsChange(e.target.checked)}
              >
                Show Managed Fields
              </Checkbox>
            </Col>
          </Row>
        }
        open={manifestModal.on}
        onOk={() => {
          setManifestModal({
            on: false,
            resource: {
              group: "",
              version: "",
              kind: "",
              name: "",
              namespace: "",
            },
            manifest: "",
          });
          setShowManagedFields(false);
        }}
        onCancel={() => {
          setManifestModal({
            on: false,
            resource: {
              group: "",
              version: "",
              kind: "",
              name: "",
              namespace: "",
            },
            manifest: "",
          });
          setShowManagedFields(false);
        }}
        cancelButtonProps={{ style: { display: "none" } }}
        width="70%"
      >
        {loadingManifest ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin />
            <div style={{ marginTop: 16 }}>Loading manifest...</div>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <ReactAce
              mode="yaml"
              theme={mode === "light" ? "github" : "twilight"}
              fontSize={12}
              showPrintMargin={true}
              showGutter={true}
              highlightActiveLine={true}
              readOnly={true}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: false,
                showLineNumbers: true,
                tabSize: 2,
                useWorker: false,
              }}
              style={{
                width: "100%",
                minHeight: "400px",
              }}
              value={manifestModal.manifest}
            />
            <Tooltip title="Copy manifest" trigger="hover">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(manifestModal.manifest);
                }}
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "10px",
                }}
              >
                <CopyOutlined
                  style={{
                    fontSize: "20px",
                  }}
                />
              </Button>
            </Tooltip>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <>
            Delete{" "}
            <span style={{ color: "red" }}>
              {deleteResourceRef.kind}/{deleteResourceRef.name}
            </span>
          </>
        }
        open={deleteResourceModal}
        onCancel={handleCancelDeleteResource}
        footer={
          <Row gutter={[8, 8]}>
            <Col>
              <Button onClick={handleCancelDeleteResource}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button
                danger
                type="primary"
                loading={deletingResource}
                onClick={handleDeleteResource}
                disabled={deleteResourceVerify !== deleteResourceRef.name}
              >
                Delete
              </Button>
            </Col>
          </Row>
        }
      >
        <Alert
          message="Are you sure you want to delete this resource?"
          description="This action cannot be undone. Type the resource name to confirm."
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
        <Descriptions bordered column={1} size="small" style={{ marginBottom: "16px" }}>
          <Descriptions.Item label="Kind">{deleteResourceRef.kind || "Unknown"}</Descriptions.Item>
          <Descriptions.Item label="Namespace">{deleteResourceRef.namespace || "default"}</Descriptions.Item>
          <Descriptions.Item label="Name">{deleteResourceRef.name || "Unknown"}</Descriptions.Item>
        </Descriptions>
        <div style={{ marginBottom: "8px", fontWeight: 600 }}>
          Type <code style={{ color: "red", padding: "2px 6px", background: "#f5f5f5", borderRadius: "4px" }}>{deleteResourceRef.name}</code> to confirm:
        </div>
        <Input
          placeholder="Enter resource name"
          value={deleteResourceVerify}
          onChange={(e) => setDeleteResourceVerify(e.target.value)}
          onPressEnter={() => {
            if (deleteResourceVerify === deleteResourceRef.name) {
              handleDeleteResource();
            }
          }}
        />
      </Modal>
    </>
  );
};

export default ResourceTree;

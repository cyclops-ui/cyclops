package mapper

import (
	apiv1 "k8s.io/api/core/v1"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

func MapNodes(nodes []apiv1.Node) []dto.Node {
	dtoNodes := make([]dto.Node, 0, len(nodes))

	for _, node := range nodes {
		allocatableCPU := node.Status.Allocatable[apiv1.ResourceCPU]
		allocatableMemory := node.Status.Allocatable[apiv1.ResourceMemory]
		allocatablePods := node.Status.Allocatable[apiv1.ResourcePods]

		dtoNodes = append(dtoNodes, dto.Node{
			Name: node.GetName(),
			Node: &node,

			AvailableResources: dto.NodeResources{
				CPU:      allocatableCPU.MilliValue(),
				Memory:   allocatableMemory.Value(),
				PodCount: allocatablePods.Value(),
			},
		})
	}

	return dtoNodes
}

func MapNode(node *apiv1.Node, pods []apiv1.Pod) dto.Node {
	nodePods := mapNodePods(pods)
	var totalCPURequests, totalMemoryRequests int64

	for _, pod := range nodePods {
		totalCPURequests += pod.CPU
		totalMemoryRequests += pod.Memory
	}

	allocatableCPU := node.Status.Allocatable[apiv1.ResourceCPU]
	allocatableMemory := node.Status.Allocatable[apiv1.ResourceMemory]
	allocatablePods := node.Status.Allocatable[apiv1.ResourcePods]

	return dto.Node{
		Name: node.GetName(),
		Node: node,
		Pods: nodePods,

		AvailableResources: dto.NodeResources{
			CPU:      allocatableCPU.MilliValue(),
			Memory:   allocatableMemory.Value(),
			PodCount: allocatablePods.Value(),
		},
		RequestedResources: dto.NodeResources{
			CPU:      totalCPURequests,
			Memory:   totalMemoryRequests,
			PodCount: int64(len(nodePods)),
		},
	}
}

func mapNodePods(pods []apiv1.Pod) []dto.NodePod {
	out := make([]dto.NodePod, 0, len(pods))

	for _, pod := range pods {
		var totalCPURequests, totalMemoryRequests int64

		for _, container := range pod.Spec.Containers {
			cpuQuantity := container.Resources.Requests[apiv1.ResourceCPU]
			cpuQuantityMilli := cpuQuantity.MilliValue()
			totalCPURequests += cpuQuantityMilli

			memoryQuantity := container.Resources.Requests[apiv1.ResourceMemory]
			memoryQuantityMilli := memoryQuantity.Value()
			totalMemoryRequests += memoryQuantityMilli
		}

		out = append(out, dto.NodePod{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			Health:    true,
			CPU:       totalCPURequests,
			Memory:    totalMemoryRequests,
		})
	}

	return out
}

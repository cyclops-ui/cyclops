package mapper

import (
	"fmt"
	"math"
	"strconv"

	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
	apiv1 "k8s.io/api/core/v1"
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

func Round(val float64, roundOn float64, places int) (newVal float64) {
	var round float64
	pow := math.Pow(10, float64(places))
	digit := pow * val
	_, div := math.Modf(digit)
	if div >= roundOn {
		round = math.Ceil(digit)
	} else {
		round = math.Floor(digit)
	}
	newVal = round / pow
	return
}

func humanizeMemory(size float64) string {
	var suffixes [5]string

	suffixes[0] = "B"
	suffixes[1] = "KB"
	suffixes[2] = "MB"
	suffixes[3] = "GB"
	suffixes[4] = "TB"

	base := math.Log(size) / math.Log(1024)
	getSize := Round(math.Pow(1024, base-math.Floor(base)), .5, 2)
	fmt.Println(int(math.Floor(base)))
	getSuffix := suffixes[int(math.Floor(base))]
	return strconv.FormatFloat(getSize, 'f', -1, 64) + " " + string(getSuffix)
}

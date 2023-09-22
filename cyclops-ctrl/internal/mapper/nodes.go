package mapper

import (
	"fmt"

	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
	apiv1 "k8s.io/api/core/v1"
)

func MapNode(nodes []apiv1.Node) []dto.Node {
	DTONode := make([]dto.Node, 0, len(nodes))

	for _, node := range nodes {
		nodeCapacity := node.Status.Capacity
		nodeAllocatable := node.Status.Allocatable

		cpuCapacity := nodeCapacity.Cpu()
		memoryCapacity := nodeCapacity.Memory()

		cpuAllocatable := nodeAllocatable.Cpu()
		memoryAllocatable := nodeAllocatable.Memory()

		cpuUsagePercent := (cpuCapacity.MilliValue() - cpuAllocatable.MilliValue()) * 100 / cpuCapacity.MilliValue()
		memoryUsagePercent := (memoryCapacity.Value() - memoryAllocatable.Value()) * 100 / memoryCapacity.Value()

		fmt.Println(cpuCapacity.String(), cpuAllocatable.String())

		DTONode = append(DTONode, dto.Node{
			Name:             node.Name,
			CPUPercentage:    cpuUsagePercent,
			MemoryPercentage: memoryUsagePercent,
		})
	}

	return DTONode
}

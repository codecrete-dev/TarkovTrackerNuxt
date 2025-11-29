import Graph from "graphology";
export function getPredecessors(graph: Graph, nodeId: string, visited: string[] = []): string[] {
  let predecessors: string[] = [];
  try {
    predecessors = graph.inNeighbors(nodeId);
    visited.push(nodeId);
  } catch (error) {
    console.error(`Error getting predecessors for node ${nodeId}:`, error);
    return [];
  }
  if (predecessors.length > 0) {
    for (const predecessor of predecessors) {
      if (visited.includes(predecessor)) {
        continue;
      }
      predecessors = predecessors.concat(getPredecessors(graph, predecessor, [...visited]));
    }
  }
  return [...new Set(predecessors)];
}
export function getSuccessors(graph: Graph, nodeId: string, visited: string[] = []): string[] {
  let successors: string[] = [];
  try {
    successors = graph.outNeighbors(nodeId);
    visited.push(nodeId);
  } catch (error) {
    console.error(`Error getting successors for node ${nodeId}:`, error);
    return [];
  }
  if (successors.length > 0) {
    for (const successor of successors) {
      if (visited.includes(successor)) {
        continue;
      }
      successors = successors.concat(getSuccessors(graph, successor, [...visited]));
    }
  }
  return [...new Set(successors)];
}
export function getParents(graph: Graph, nodeId: string): string[] {
  try {
    return graph.inNeighbors(nodeId);
  } catch (error) {
    console.error(`Error getting parents for node ${nodeId}:`, error);
    return [];
  }
}
export function getChildren(graph: Graph, nodeId: string): string[] {
  try {
    return graph.outNeighbors(nodeId);
  } catch (error) {
    console.error(`Error getting children for node ${nodeId}:`, error);
    return [];
  }
}
export function safeAddNode(graph: Graph, nodeId: string): void {
  try {
    graph.mergeNode(nodeId);
  } catch (error) {
    console.error(`Error adding node ${nodeId} to graph:`, error);
  }
}
export function safeAddEdge(graph: Graph, sourceId: string, targetId: string): void {
  try {
    if (graph.hasNode(sourceId) && graph.hasNode(targetId)) {
      graph.mergeEdge(sourceId, targetId);
    } else {
      console.warn(
        `Cannot add edge from ${sourceId} to ${targetId}: one or both nodes don't exist`
      );
    }
  } catch (error) {
    console.error(`Error adding edge from ${sourceId} to ${targetId}:`, error);
  }
}
export function createGraph(): Graph {
  return new Graph();
}
export function hasNode(graph: Graph, nodeId: string): boolean {
  try {
    return graph.hasNode(nodeId);
  } catch (error) {
    console.error(`Error checking if node ${nodeId} exists:`, error);
    return false;
  }
}
export function getAllNodes(graph: Graph): string[] {
  try {
    return graph.nodes();
  } catch (error) {
    console.error("Error getting all nodes:", error);
    return [];
  }
}
export function clearGraph(graph: Graph): void {
  try {
    graph.clear();
  } catch (error) {
    console.error("Error clearing graph:", error);
  }
}

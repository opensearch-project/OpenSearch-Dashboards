/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CelestialEdge, CelestialNode } from '../../types';

/**
 * Everything the layout reads: node order, ids, visibility, sizes and nesting, and the
 * visible connections. Node data (titles, metrics, health) is not part of it, so a metrics
 * update keeps the same signature and does not need a new layout.
 */
export const layoutSignature = (nodes: CelestialNode[], edges: CelestialEdge[]): string => {
  const n = nodes.map(
    (node) =>
      `${node.id}|${node.hidden ? 1 : 0}|${node.width ?? ''}|${node.height ?? ''}|${
        node.parentId ?? ''
      }`
  );
  const e = edges.map((edge) => `${edge.id}|${edge.source}|${edge.target}|${edge.hidden ? 1 : 0}`);
  return `${n.join(',')}#${e.join(',')}`;
};

/**
 * Apply a previous layout to nodes and edges whose layout inputs are unchanged (same
 * layoutSignature): positions, container sizes and edge handles come from the previous
 * result, everything else from the new elements.
 */
export const reuseLayout = (
  previous: { nodes: CelestialNode[]; edges: CelestialEdge[] },
  nodes: CelestialNode[],
  edges: CelestialEdge[]
): { nodes: CelestialNode[]; edges: CelestialEdge[] } => {
  const laidOut = new Map(previous.nodes.map((node) => [node.id, node]));
  const wired = new Map(previous.edges.map((edge) => [edge.id, edge]));
  return {
    nodes: nodes.map((node) => {
      const prev = laidOut.get(node.id);
      if (!prev) return node;
      return {
        ...node,
        position: prev.position,
        // Containers are sized by the layout.
        ...(prev.width !== node.width && { width: prev.width, height: prev.height }),
        ...(prev.style !== node.style &&
          prev.style?.width !== undefined && {
            style: { ...node.style, width: prev.style.width, height: prev.style.height },
          }),
      };
    }),
    edges: edges.map((edge) => {
      const prev = wired.get(edge.id);
      return prev
        ? { ...edge, sourceHandle: prev.sourceHandle, targetHandle: prev.targetHandle }
        : edge;
    }),
  };
};

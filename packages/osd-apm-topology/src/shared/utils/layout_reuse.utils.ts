/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CelestialEdge, CelestialNode } from '../../types';
import type { LayoutOptions } from '../hooks/use_celestial_layout.hook';

/** A value key for layout options (all primitives), independent of key order. */
export const layoutOptionsKey = (options?: LayoutOptions): string =>
  options
    ? JSON.stringify(
        Object.keys(options)
          .sort()
          .map((key) => [key, options[key as keyof LayoutOptions]])
      )
    : '';

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
 * layoutSignature): positions, the sizes the layout gave containers, and edge handles come
 * from the previous result, everything else from the new elements. Nodes keep the previous
 * result's order (the layout puts parents before their children, as React Flow expects).
 */
export const reuseLayout = (
  previous: { nodes: CelestialNode[]; edges: CelestialEdge[] },
  nodes: CelestialNode[],
  edges: CelestialEdge[]
): { nodes: CelestialNode[]; edges: CelestialEdge[] } => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const wired = new Map(previous.edges.map((edge) => [edge.id, edge]));
  const placed = previous.nodes.flatMap((prev) => {
    const node = byId.get(prev.id);
    if (!node) return [];
    byId.delete(prev.id);
    return [
      {
        ...node,
        position: prev.position,
        // Containers are sized by the layout (width and height, and their style).
        ...(prev.width !== undefined && { width: prev.width }),
        ...(prev.height !== undefined && { height: prev.height }),
        ...((prev.style?.width !== undefined || prev.style?.height !== undefined) && {
          style: { ...node.style, width: prev.style?.width, height: prev.style?.height },
        }),
      },
    ];
  });
  return {
    // Any node the previous layout did not have (not expected with an equal signature) last.
    nodes: [...placed, ...byId.values()],
    edges: edges.map((edge) => {
      const prev = wired.get(edge.id);
      return prev
        ? { ...edge, sourceHandle: prev.sourceHandle, targetHandle: prev.targetHandle }
        : edge;
    }),
  };
};

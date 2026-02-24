/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Edge, EdgeProps, Node, NodeProps } from '@xyflow/react';
import { ReactNode } from 'react';
import type { CelestialCardProps } from './components/CelestialCard';
import type { LayoutOptions } from './shared/hooks/use-celestial-layout.hook';
import { Breadcrumb } from './components';

export type CelestialNode = Node<CelestialCardProps>;
export type CelestialEdge = Edge;

export type CelestialNodes = CelestialNode[];
export type CelestialEdges = CelestialEdge[];

export interface CelestialMapModel {
  nodes: CelestialNodes;
  edges: CelestialEdges;
}

/** Base data shape shared by all node types */
export interface BaseNodeData {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  status?: 'ok' | 'warning' | 'error' | 'critical' | 'unknown';
  statusLabel?: string;
  statusIcon?: ReactNode;
  isFaded?: boolean;
  /** Configurable action button. `false` hides the button entirely. */
  actionButton?:
    | {
        label: string;
        onClick?: () => void;
        icon?: ReactNode;
      }
    | false;
}

/** Data-driven edge style options */
export interface CelestialEdgeStyleData {
  /** @deprecated Use `type` instead */
  dashed?: boolean;
  /** @deprecated Use `animationType` instead */
  animated?: boolean;
  color?: string;
  label?: string;
  /** Arrowhead marker style. Default: 'arrowClosed' */
  marker?: 'arrow' | 'arrowClosed' | 'none';
  /** Stroke type. Takes precedence over `dashed`. */
  type?: 'solid' | 'dashed' | 'dotted';
  /** Animation style. Takes precedence over `animated`. */
  animationType?: 'none' | 'flow' | 'pulse';
  /** Stroke width in pixels. Default: 2 */
  strokeWidth?: number;
  /** Custom label styling */
  labelStyle?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
  };
}

export interface CelestialMapProps {
  map: { [groupId: string]: CelestialMapModel };
  nodesInFocus?: CelestialNode[];
  isLoading?: boolean;
  onGroupBy?: (event: any, detail: any) => void;
  onDashboardClick?: (node?: CelestialCardProps) => void;
  onDataFetch?: (node?: CelestialCardProps) => void;
  layoutOptions?: LayoutOptions;
  onEdgeClick?: (edge: CelestialEdge) => void;
  emptyState?: ReactNode;
  breadcrumbHotspot?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  onBreadcrumbClick?: (Breadcrumb: Breadcrumb, index: number) => void;
  navigateToBreadcrumb?: (index: number) => void;
  addBreadcrumb?: (title: string, node?: CelestialCardProps) => void;
  numMatchesForFilters?: number;
  selectedNodeId?: string;
  topN?: number;

  /** Custom node type components. Merged with built-in defaults. */
  nodeTypes?: Record<string, React.ComponentType<NodeProps<any>>>;

  /** Custom edge type components. Merged with built-in defaults. */
  edgeTypes?: Record<string, React.ComponentType<EdgeProps<any>>>;

  /** Custom legend content. `false` hides legend. `undefined` shows default APM legend. */
  legend?: ReactNode | false;

  /** Show the ReactFlow minimap overlay. Default: false */
  showMinimap?: boolean;

  /** Show SLI/SLO entries in the default legend. Default: false */
  showSliSlo?: boolean;
}

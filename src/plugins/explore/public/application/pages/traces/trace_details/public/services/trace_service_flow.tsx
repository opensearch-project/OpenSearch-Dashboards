/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@osd/i18n';
// @ts-expect-error TS7016 @osd/apm-topology ships without consumer-resolvable types here
import { CelestialMap, MetricsCardNode, VolumeEdge } from '@osd/apm-topology';
import { spansToServiceFlow, ServiceFlowHit } from './trace_service_flow_transform';
import './trace_service_flow.scss';

const NODE_TYPES = { metricsCard: MetricsCardNode };
const EDGE_TYPES = { volumeEdge: VolumeEdge };

export interface TraceServiceFlowProps {
  hits: ServiceFlowHit[];
  colorMap?: Record<string, string>;
  /** Service name currently applied as a filter (highlighted on the map). */
  activeServiceFilter?: string;
  /** Clicking a service card filters the trace by that service. */
  onFilterService?: (serviceName: string) => void;
}

/**
 * "Trace map" tab: a per-trace service topology built on @osd/apm-topology's
 * reusable MetricsCardNode (Requests / Errors / Duration bars) + VolumeEdge
 * (thickness = call volume, count on hover). Clicking a service filters the
 * whole trace view by that service; the filtered service is highlighted.
 */
export const TraceServiceFlow: React.FC<TraceServiceFlowProps> = ({
  hits,
  colorMap = {},
  activeServiceFilter,
  onFilterService,
}) => {
  const { map } = useMemo(() => spansToServiceFlow(hits, colorMap), [hits, colorMap]);

  // Highlight the filtered service via node data (not selectedNodeId, which
  // would camera-focus a single node and chop the rest of the graph).
  const displayMap = useMemo(
    () => ({
      root: {
        edges: map.root.edges,
        nodes: map.root.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isSelected: !!activeServiceFilter && node.id === activeServiceFilter,
          },
        })),
      },
    }),
    [map, activeServiceFilter]
  );

  // The package fits once (clamped zoom) and never re-fits on resize; remount on
  // a settled size change so fitView measures the real (possibly flyout) size.
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitKey, setFitKey] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const rect = el.getBoundingClientRect();
    let lastWidth = rect.width;
    let lastHeight = rect.height;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 0, height: 0 };
      if (
        width > 0 &&
        height > 0 &&
        (Math.abs(width - lastWidth) > 8 || Math.abs(height - lastHeight) > 8)
      ) {
        lastWidth = width;
        lastHeight = height;
        setFitKey((key) => key + 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Signature of the node/edge SET (not selection) — changing it remounts the
  // map so it re-fits when a filter adds/removes services; selection-only
  // changes (isSelected) keep the same signature and update in place.
  const dataSignature = useMemo(
    () =>
      `${map.root.nodes
        .map((node) => node.id)
        .sort()
        .join(',')}|${map.root.edges
        .map((edge) => edge.id)
        .sort()
        .join(',')}`,
    [map]
  );

  if (map.root.nodes.length === 0) {
    return (
      <EuiEmptyPrompt
        iconType="graphApp"
        data-test-subj="traceServiceFlowEmpty"
        title={
          <h2>
            {i18n.translate('explore.traceView.traceMap.emptyTitle', {
              defaultMessage: 'No services found',
            })}
          </h2>
        }
        body={
          <p>
            {i18n.translate('explore.traceView.traceMap.emptyBody', {
              defaultMessage: 'This trace has no service information to display.',
            })}
          </p>
        }
      />
    );
  }

  return (
    <div
      className="exploreTraceServiceFlow__container"
      data-test-subj="traceServiceFlow"
      ref={containerRef}
    >
      <CelestialMap
        key={`${fitKey}-${dataSignature}`}
        map={displayMap}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        layoutOptions={{ direction: 'LR', rankSeparation: 160, nodeSeparation: 60 }}
        legend={false}
        breadcrumbs={[]}
        showMinimap
        topN={Infinity}
        onDashboardClick={(node?: { id?: string }) => {
          if (node?.id) onFilterService?.(node.id);
        }}
      />
    </div>
  );
};

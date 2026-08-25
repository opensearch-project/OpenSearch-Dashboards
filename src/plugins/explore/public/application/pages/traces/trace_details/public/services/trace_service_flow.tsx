/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@osd/i18n';
// @ts-expect-error TS7016 @osd/apm-topology ships without consumer-resolvable types here
import { CelestialMap } from '@osd/apm-topology';
import { spansToServiceFlow, ServiceFlowHit } from './trace_service_flow_transform';
import { TraceServiceNode } from './trace_service_node';
import { TraceServiceEdge } from './trace_service_edge';
import './trace_service_flow.scss';

const NODE_TYPES = { traceServiceCard: TraceServiceNode };
const EDGE_TYPES = { traceCallEdge: TraceServiceEdge };

export interface TraceServiceFlowProps {
  hits: ServiceFlowHit[];
  colorMap?: Record<string, string>;
  /** Service name currently applied as a filter (highlighted on the map). */
  activeServiceFilter?: string;
  /** Clicking a service card filters the trace by that service. */
  onFilterService?: (serviceName: string) => void;
}

/**
 * "Trace map" tab: a per-trace service topology (custom nodes with Requests /
 * Errors / Duration bars, custom call-volume edges). Clicking a service filters
 * the whole trace view by that service; the filtered service is highlighted.
 */
export const TraceServiceFlow: React.FC<TraceServiceFlowProps> = ({
  hits,
  colorMap = {},
  activeServiceFilter,
  onFilterService,
}) => {
  const { map } = useMemo(() => spansToServiceFlow(hits, colorMap), [hits, colorMap]);

  // Inject the click handler + active-filter highlight into node data.
  const displayMap = useMemo(
    () => ({
      root: {
        edges: map.root.edges,
        nodes: map.root.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isFilterActive: !!activeServiceFilter && node.id === activeServiceFilter,
            onSelect: onFilterService,
          },
        })),
      },
    }),
    [map, activeServiceFilter, onFilterService]
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
        key={fitKey}
        map={displayMap}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        layoutOptions={{ direction: 'LR', rankSeparation: 160, nodeSeparation: 60 }}
        legend={false}
        breadcrumbs={[]}
        showMinimap
        topN={Infinity}
      />
    </div>
  );
};

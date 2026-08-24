/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@osd/i18n';
// @ts-expect-error TS7016 @osd/apm-topology ships without consumer-resolvable types here
import { CelestialMap, ServiceCardNode } from '@osd/apm-topology';
import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';
import { spansToServiceFlow, ServiceFlowHit } from './trace_service_flow_transform';
import './trace_service_flow.scss';

const NODE_TYPES = { serviceCard: ServiceCardNode };

export interface TraceServiceFlowProps {
  hits: ServiceFlowHit[];
  colorMap?: Record<string, string>;
  selectedSpanId?: string;
  /** Called with the entry span of the clicked service (undefined when unresolved). */
  onSelectSpan?: (spanId?: string) => void;
}

/**
 * "Trace map" tab content: a per-trace service topology rendered with
 * @osd/apm-topology's CelestialMap + ServiceCardNode. Nodes are the services in
 * the trace with per-trace RED metrics; edges are the service-to-service call
 * flow. Clicking a service selects its entry span in the shared trace state.
 */
export const TraceServiceFlow: React.FC<TraceServiceFlowProps> = ({
  hits,
  colorMap = {},
  selectedSpanId,
  onSelectSpan,
}) => {
  const { map, entrySpanByService } = useMemo(
    () => spansToServiceFlow(hits, colorMap),
    [hits, colorMap]
  );

  const selectedService = useMemo(() => {
    if (!selectedSpanId || !hits || hits.length === 0) return undefined;
    const span = hits.find((hit) => hit.spanId === selectedSpanId);
    return span ? resolveServiceNameFromSpan(span) || span.serviceName : undefined;
  }, [selectedSpanId, hits]);

  // Mark the selected service with a badge instead of driving the package's
  // selectedNodeId (which fits/zooms the camera onto that single node, chopping
  // the rest of the graph and fighting manual zoom). This keeps the map fit to
  // all nodes while still showing which service is selected. A service that
  // already has an error badge keeps it (errors take priority over selection).
  const displayMap = useMemo(() => {
    if (!selectedService) return map;
    return {
      root: {
        edges: map.root.edges,
        nodes: map.root.nodes.map((node) =>
          node.id === selectedService && node.data.typeBadge === false
            ? {
                ...node,
                data: { ...node.data, typeBadge: { label: 'Selected', color: '#0268BC' } },
              }
            : node
        ),
      },
    };
  }, [map, selectedService]);

  // The package fits the graph once, one tick after layout, clamped to zoom
  // 0.6-1.0 and never re-fits on resize. In a flyout/resizable panel the
  // container is often mis-sized at that moment, chopping/mis-centering nodes.
  // Remounting on a settled size change (width OR height — the flyout uses a
  // vertical split) forces a fresh fitView against the real size.
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
        layoutOptions={{ direction: 'LR', rankSeparation: 160, nodeSeparation: 60 }}
        legend={false}
        breadcrumbs={[]}
        showMinimap
        topN={Infinity}
        onDashboardClick={(node?: { id?: string }) =>
          onSelectSpan?.(node?.id ? entrySpanByService[node.id] : undefined)
        }
      />
    </div>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@osd/i18n';
// @ts-expect-error TS7016 @osd/apm-topology ships without consumer-resolvable types here
import { CelestialMap, ServiceCircleNode } from '@osd/apm-topology';
import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';
import { spansToServiceFlow, ServiceFlowHit } from './trace_service_flow_transform';
import './trace_service_flow.scss';

const NODE_TYPES = { serviceCircle: ServiceCircleNode };

export interface TraceServiceFlowProps {
  hits: ServiceFlowHit[];
  colorMap?: Record<string, string>;
  selectedSpanId?: string;
  /** Called with the clicked service name (or undefined when cleared). */
  onSelectService?: (serviceName?: string) => void;
}

/**
 * "Trace map" tab content: a per-trace service topology rendered with
 * @osd/apm-topology's CelestialMap + ServiceCircleNode. Nodes are the services
 * in this trace; edges are the service-to-service call flow derived from the
 * span parent/child relationships.
 */
export const TraceServiceFlow: React.FC<TraceServiceFlowProps> = ({
  hits,
  colorMap = {},
  selectedSpanId,
  onSelectService,
}) => {
  const mapData = useMemo(() => spansToServiceFlow(hits, colorMap), [hits, colorMap]);

  const selectedService = useMemo(() => {
    if (!selectedSpanId || !hits || hits.length === 0) return undefined;
    const span = hits.find((hit) => hit.spanId === selectedSpanId);
    return span ? resolveServiceNameFromSpan(span) || span.serviceName : undefined;
  }, [selectedSpanId, hits]);

  if (mapData.root.nodes.length === 0) {
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
    <div className="exploreTraceServiceFlow__container" data-test-subj="traceServiceFlow">
      <CelestialMap
        map={mapData}
        nodeTypes={NODE_TYPES}
        layoutOptions={{ direction: 'LR', rankSeparation: 180, nodeSeparation: 120 }}
        legend={false}
        showMinimap
        topN={Infinity}
        selectedNodeId={selectedService}
        onNodeClickZoom="zoomToNode"
        onDashboardClick={(node?: { id?: string }) => onSelectService?.(node?.id)}
      />
    </div>
  );
};

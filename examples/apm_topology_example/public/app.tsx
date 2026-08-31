/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import {
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiDescriptionList,
  EuiEmptyPrompt,
  EuiTabs,
  EuiTab,
  EuiSwitch,
  EuiButtonGroup,
} from '@elastic/eui';
import {
  CelestialMap,
  getIcon,
  AgentCardNode,
  ServiceCardNode,
  ServiceCircleNode,
  MetricsCardNode,
  VolumeEdge,
  AGENT_NODE_KINDS,
} from '@osd/apm-topology';
import type {
  CelestialMapProps,
  CelestialEdge,
  CelestialCardProps,
  MetricsCardData,
} from '@osd/apm-topology';
import { agentTraceNodes, agentTraceEdges } from './agent_mock_data';
import './app.scss';

type MapTab = 'apmCards' | 'apmCircles' | 'agentCards' | 'traceMap' | 'features';

// ---------------------------------------------------------------------------
// Shared APM mock data
// ---------------------------------------------------------------------------
const buildApmNodes = (nodeType: string) => [
  {
    id: '1',
    type: nodeType,
    position: { x: 100, y: 100 },
    data: {
      id: '1',
      title: 'API Gateway',
      subtitle: 'AWS::APIGateway',
      icon: getIcon('AWS::APIGateway'),
      isGroup: false,
      keyAttributes: {},
      isInstrumented: true,
      health: { breached: 0, recovered: 0, total: 0, status: 'ok' },
      metrics: { requests: 5000, faults5xx: 25, errors4xx: 100 },
      color: '#6366F1', // indigo — custom node color demo
    },
  },
  {
    id: '2',
    type: nodeType,
    position: { x: 400, y: 100 },
    data: {
      id: '2',
      title: 'User Service',
      subtitle: 'AWS::Lambda',
      icon: getIcon('AWS::Lambda'),
      isGroup: false,
      keyAttributes: {},
      isInstrumented: true,
      health: { breached: 0, recovered: 2, total: 5, status: 'recovered' },
      metrics: { requests: 4500, faults5xx: 10, errors4xx: 50 },
    },
  },
  {
    id: '3',
    type: nodeType,
    position: { x: 700, y: 100 },
    data: {
      id: '3',
      title: 'Order Service',
      subtitle: 'AWS::Lambda',
      icon: getIcon('AWS::Lambda'),
      isGroup: false,
      keyAttributes: {},
      isInstrumented: true,
      health: { breached: 5, recovered: 0, total: 8, status: 'breached' },
      metrics: { requests: 2000, faults5xx: 300, errors4xx: 150 },
      color: '#10B981', // emerald — overridden by breach state
    },
  },
  {
    id: '4',
    type: nodeType,
    position: { x: 250, y: 300 },
    data: {
      id: '4',
      title: 'User Database',
      subtitle: 'AWS::DynamoDB',
      icon: getIcon('AWS::DynamoDB'),
      isGroup: false,
      keyAttributes: {},
      isInstrumented: true,
      health: { breached: 0, recovered: 0, total: 0, status: 'ok' },
      metrics: { requests: 8000, faults5xx: 0, errors4xx: 5 },
    },
  },
  {
    id: '5',
    type: nodeType,
    position: { x: 550, y: 300 },
    data: {
      id: '5',
      title: 'Order Database',
      subtitle: 'AWS::RDS',
      icon: getIcon('AWS::RDS'),
      isGroup: false,
      keyAttributes: {},
      isInstrumented: true,
      health: { breached: 0, recovered: 0, total: 0, status: 'ok' },
      metrics: { requests: 3500, faults5xx: 2, errors4xx: 10 },
    },
  },
];

const apmEdges = [
  { id: 'edge-1', source: '1', target: '2' },
  { id: 'edge-2', source: '1', target: '3' },
  { id: 'edge-3', source: '2', target: '4' },
  { id: 'edge-4', source: '3', target: '5' },
];

// Styled edges for the Features tab demo — `type: 'celestialEdge'` activates custom rendering
const styledEdges = [
  {
    id: 'edge-1',
    source: '1',
    target: '2',
    type: 'celestialEdge',
    data: { style: { color: '#3B82F6', label: '2.1k rps', animationType: 'flow' } },
  },
  {
    id: 'edge-2',
    source: '1',
    target: '3',
    type: 'celestialEdge',
    data: { style: { color: '#EF4444', type: 'dashed', label: '500 rps', marker: 'arrow' } },
  },
  {
    id: 'edge-3',
    source: '2',
    target: '4',
    type: 'celestialEdge',
    data: { style: { animationType: 'pulse', strokeWidth: 3 } },
  },
  {
    id: 'edge-4',
    source: '3',
    target: '5',
    type: 'celestialEdge',
    data: { style: { type: 'dotted', color: '#F59E0B', marker: 'none' } },
  },
];

// ---------------------------------------------------------------------------
// Per-trace service map mock data (MetricsCardNode + VolumeEdge)
//
// Mirrors how the Explore "Trace map" tab renders a single trace: one card per
// service with RED-style metric bars (Requests / Errors / Duration), and edges
// whose thickness encodes cross-service call volume (exact count on hover).
// ---------------------------------------------------------------------------
const COUNT_COLOR = '#69707D'; // subdued
const ERROR_COLOR = '#BD271E'; // danger
const OK_COLOR = '#017D73'; // success
const DURATION_COLOR = '#0268BC'; // primary

const traceService = (
  id: string,
  title: string,
  color: string,
  requests: number,
  errors: number,
  durationMs: number,
  maxRequests: number,
  maxDurationMs: number
): { id: string; type: string; position: { x: number; y: number }; data: MetricsCardData } => ({
  id,
  type: 'metricsCard',
  position: { x: 0, y: 0 },
  data: {
    id,
    title,
    color,
    hasError: errors > 0,
    metrics: [
      {
        label: 'Requests',
        value: requests,
        max: maxRequests,
        color: COUNT_COLOR,
        formattedValue: `${requests}`,
      },
      {
        label: 'Errors',
        value: errors,
        max: requests || 1,
        color: errors > 0 ? ERROR_COLOR : OK_COLOR,
        formattedValue: errors > 0 ? `${errors} (${Math.round((errors / requests) * 100)}%)` : '0',
      },
      {
        label: 'Duration',
        value: durationMs,
        max: maxDurationMs,
        color: DURATION_COLOR,
        formattedValue:
          durationMs >= 1000 ? `${(durationMs / 1000).toFixed(2)}s` : `${durationMs}ms`,
      },
    ],
  },
});

const traceServiceNodes = [
  traceService('frontend', 'frontend', '#6092C0', 12, 0, 320, 12, 900),
  traceService('cart', 'cart', '#9170B8', 7, 0, 210, 12, 900),
  traceService('payment', 'payment', '#D36086', 3, 2, 900, 12, 900),
  traceService('inventory', 'inventory', '#54B399', 5, 0, 140, 12, 900),
];

const traceServiceEdges = [
  {
    id: 'frontend->cart',
    source: 'frontend',
    target: 'cart',
    type: 'volumeEdge',
    data: { volume: 8, maxVolume: 8, hasError: false, label: '8 calls' },
  },
  {
    id: 'cart->payment',
    source: 'cart',
    target: 'payment',
    type: 'volumeEdge',
    data: { volume: 3, maxVolume: 8, hasError: true, label: '3 calls' },
  },
  {
    id: 'cart->inventory',
    source: 'cart',
    target: 'inventory',
    type: 'volumeEdge',
    data: { volume: 5, maxVolume: 8, hasError: false, label: '5 calls' },
  },
];

// ---------------------------------------------------------------------------
// Agent legend (custom ReactNode for legend prop)
// ---------------------------------------------------------------------------
const AgentLegend = () => (
  <div className="osd:w-52 osd:p-3 osd:bg-container-default osd:rounded-xl osd:shadow-md osd:text-xs osd:text-body-secondary">
    <div className="osd:font-bold osd:text-sm osd:mb-2">Agent Trace Legend</div>
    <ul className="osd:grid osd:gap-1.5">
      {Object.entries(AGENT_NODE_KINDS).map(([kind, config]) => (
        <li key={kind} className="osd:flex osd:items-center osd:gap-2">
          <span
            className="osd:w-4 osd:h-4 osd:inline-block osd:rounded-sm osd:flex-shrink-0"
            style={{ backgroundColor: config.color, padding: 2 }}
          >
            <img
              src={config.icon}
              alt={config.label}
              style={{ width: '100%', height: '100%', filter: 'brightness(0) invert(1)' }}
            />
          </span>
          {config.label}
        </li>
      ))}
    </ul>
    <div className="osd:mt-2 osd:border-t osd:border-divider-default osd:pt-2">
      <div className="osd:font-bold osd:mb-1">Edges</div>
      <div className="osd:flex osd:items-center osd:gap-2">
        <span style={{ borderBottom: '2px dashed #888', width: 16, display: 'inline-block' }} />
        Invocation (flow)
      </div>
      <div className="osd:flex osd:items-center osd:gap-2">
        <span style={{ borderBottom: '2px solid #888', width: 16, display: 'inline-block' }} />
        Data flow
      </div>
      <div className="osd:flex osd:items-center osd:gap-2">
        <span style={{ borderBottom: '2px dotted #888', width: 16, display: 'inline-block' }} />
        Embedding
      </div>
    </div>
  </div>
);

// Edge styles legend for the Features tab
const EdgeStylesLegend = () => (
  <div className="osd:w-52 osd:p-3 osd:bg-container-default osd:rounded-xl osd:shadow-md osd:text-xs osd:text-body-secondary">
    <div className="osd:font-bold osd:text-sm osd:mb-2">Edge Styles</div>
    <ul className="osd:grid osd:gap-1.5">
      <li className="osd:flex osd:items-center osd:gap-2">
        <span style={{ borderBottom: '2px solid #3B82F6', width: 16, display: 'inline-block' }} />
        Flow animation + label
      </li>
      <li className="osd:flex osd:items-center osd:gap-2">
        <span style={{ borderBottom: '2px dashed #EF4444', width: 16, display: 'inline-block' }} />
        Dashed + open arrow
      </li>
      <li className="osd:flex osd:items-center osd:gap-2">
        <span style={{ borderBottom: '3px solid #888', width: 16, display: 'inline-block' }} />
        Pulse animation (3px)
      </li>
      <li className="osd:flex osd:items-center osd:gap-2">
        <span style={{ borderBottom: '2px dotted #F59E0B', width: 16, display: 'inline-block' }} />
        Dotted + no marker
      </li>
    </ul>
    <div className="osd:mt-2 osd:border-t osd:border-divider-default osd:pt-2 osd:text-body-secondary">
      All edges have arrowhead markers by default. Use <code>marker: &apos;none&apos;</code> to
      hide.
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Tab descriptions shown above the map
// ---------------------------------------------------------------------------
const TAB_DESCRIPTIONS: Record<MapTab, { title: string; description: string }> = {
  apmCards: {
    title: 'APM Service Map — Default Cards',
    description:
      'The default APM topology view using the original celestialNode card type. Shows health donuts, SLI status, request metrics, and "View insights" buttons.',
  },
  apmCircles: {
    title: 'APM Service Map — Circle Nodes',
    description:
      'An alternative circle-based rendering with health arcs proportional to faults/errors/ok. Compact layout suitable for large topologies.',
  },
  agentCards: {
    title: 'Agent Trace Map — GenAI Nodes',
    description:
      'Agent/LLM/Tool/Retrieval/Embeddings/Other trace visualization. Nodes show SVG type icons, provider icons next to model names, hover glow in type color, and selection glow rings. Edges demonstrate flow animation, pulse animation, dotted styles, and arrowhead markers.',
  },
  traceMap: {
    title: 'Trace Map — Per-Trace Service Flow',
    description:
      'A single trace rendered as a service topology using MetricsCardNode (RED metric bars: Requests / Errors / Duration) and VolumeEdge (stroke thickness encodes call volume; exact count shows on hover). The whole card is clickable; error services get a red border + dot. This is the reusable pattern the Explore "Trace map" tab is built on.',
  },
  features: {
    title: 'Features — Edge Styles, Animations & Glow Effects',
    description:
      'Demonstrates extended edge options: flow/pulse animations, dotted strokes, open/closed/no arrowheads, custom stroke width, and label styling. Hover over nodes for colored glow; click to see selection glow ring.',
  },
};

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------
const ApmTopologyExampleApp = () => {
  const [activeTab, setActiveTab] = useState<MapTab>('apmCards');
  const [selectedNode, setSelectedNode] = useState<CelestialCardProps | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<CelestialEdge | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [hideLegend, setHideLegend] = useState(false);
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const [showMinimap, setShowMinimap] = useState(true);
  const [showSliSlo, setShowSliSlo] = useState(false);

  const addEvent = (event: string) => {
    setEventLog((prev) => [event, ...prev].slice(0, 10));
  };

  const switchTab = (tab: MapTab) => {
    setActiveTab(tab);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const sharedCallbacks = useMemo(
    () => ({
      onDashboardClick: (node?: CelestialCardProps) => {
        if (node) {
          setSelectedNode(node);
          setSelectedEdge(null);
          addEvent(`Clicked node: ${node.title}`);
        }
      },
      onDataFetch: (node?: CelestialCardProps) => {
        if (node) {
          addEvent(`Fetching data for: ${node.title}`);
        }
      },
      onEdgeClick: (edge: CelestialEdge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
        addEvent(`Clicked edge: ${edge.source} → ${edge.target}`);
      },
    }),
    []
  );

  // --- Build map props per tab ---

  const mapProps: Record<MapTab, CelestialMapProps> = useMemo(
    () => ({
      apmCards: {
        map: { root: { nodes: buildApmNodes('celestialNode'), edges: apmEdges } },
        layoutOptions: { direction },
        showMinimap,
        showSliSlo,
        onNodeClickZoom: 'zoomToNode',
        onEdgeClickZoom: 'zoomToEdge',
        ...sharedCallbacks,
      },
      apmCircles: {
        map: { root: { nodes: buildApmNodes('serviceCircle'), edges: apmEdges } },
        nodeTypes: { serviceCircle: ServiceCircleNode },
        layoutOptions: { direction },
        showMinimap,
        showSliSlo,
        onNodeClickZoom: 'zoomToNeighborhood',
        onEdgeClickZoom: 'zoomToEdge',
        ...sharedCallbacks,
      },
      agentCards: {
        map: { root: { nodes: agentTraceNodes as any, edges: agentTraceEdges as any } },
        nodeTypes: { agentCard: AgentCardNode },
        legend: <AgentLegend />,
        layoutOptions: { direction },
        showMinimap,
        ...sharedCallbacks,
      },
      traceMap: {
        map: { root: { nodes: traceServiceNodes as any, edges: traceServiceEdges as any } },
        nodeTypes: { metricsCard: MetricsCardNode },
        edgeTypes: { volumeEdge: VolumeEdge },
        layoutOptions: { direction, rankSeparation: 160, nodeSeparation: 60 },
        legend: false,
        showMinimap,
        ...sharedCallbacks,
      },
      features: {
        map: { root: { nodes: buildApmNodes('serviceCard'), edges: styledEdges } },
        nodeTypes: { serviceCard: ServiceCardNode },
        legend: hideLegend ? false : <EdgeStylesLegend />,
        layoutOptions: { direction },
        showMinimap,
        nodesDraggable: true,
        onNodeClickZoom: 'zoomToNode',
        onEdgeClickZoom: 'zoomToEdge',
        ...sharedCallbacks,
      },
    }),
    [sharedCallbacks, hideLegend, direction, showMinimap, showSliSlo]
  );

  // --- Details panel ---

  const renderDetailsContent = () => {
    if (selectedNode) {
      return (
        <>
          <EuiTitle size="s">
            <h4>{selectedNode.title}</h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          {activeTab === 'agentCards' ? (
            <EuiDescriptionList
              listItems={[
                { title: 'Kind', description: (selectedNode as any).nodeKind ?? 'Unknown' },
                { title: 'Duration', description: (selectedNode as any).latency ?? 'N/A' },
                { title: 'Model', description: (selectedNode as any).model ?? 'N/A' },
                { title: 'Provider', description: (selectedNode as any).provider ?? 'N/A' },
                { title: 'Status', description: (selectedNode as any).status ?? 'N/A' },
              ]}
              compressed
            />
          ) : activeTab === 'traceMap' ? (
            <>
              {(selectedNode as any).hasError && (
                <>
                  <EuiCallOut title="Service has errors" color="danger" size="s" />
                  <EuiSpacer size="m" />
                </>
              )}
              <EuiDescriptionList
                listItems={((selectedNode as any).metrics ?? []).map((m: any) => ({
                  title: m.label,
                  description: m.formattedValue ?? String(m.value),
                }))}
                compressed
              />
            </>
          ) : (
            <>
              <EuiDescriptionList
                listItems={[
                  { title: 'Type', description: selectedNode.subtitle ?? 'Unknown' },
                  {
                    title: 'Instrumented',
                    description: (selectedNode as any).isInstrumented ? 'Yes' : 'No',
                  },
                ]}
                compressed
              />
              <EuiSpacer size="m" />
              {(selectedNode as any).health && (
                <EuiCallOut
                  title={`Health: ${(selectedNode as any).health?.status?.toUpperCase() ?? 'N/A'}`}
                  color={(selectedNode as any).health?.status === 'breached' ? 'danger' : 'success'}
                  size="s"
                >
                  <EuiDescriptionList
                    listItems={[
                      {
                        title: 'Breached',
                        description: String((selectedNode as any).health?.breached ?? 0),
                      },
                      {
                        title: 'Recovered',
                        description: String((selectedNode as any).health?.recovered ?? 0),
                      },
                      {
                        title: 'Total SLIs',
                        description: String((selectedNode as any).health?.total ?? 0),
                      },
                    ]}
                    compressed
                  />
                </EuiCallOut>
              )}
              {(selectedNode as any).metrics?.requests && (
                <>
                  <EuiSpacer size="m" />
                  <EuiTitle size="xxs">
                    <h5>Metrics</h5>
                  </EuiTitle>
                  <EuiSpacer size="xs" />
                  <EuiDescriptionList
                    listItems={[
                      {
                        title: 'Requests',
                        description: (selectedNode as any).metrics.requests?.toLocaleString(),
                      },
                      {
                        title: '5xx Faults',
                        description: `${(selectedNode as any).metrics.faults5xx?.toLocaleString()} (${(
                          (((selectedNode as any).metrics.faults5xx ?? 0) /
                            ((selectedNode as any).metrics.requests ?? 1)) *
                          100
                        ).toFixed(2)}%)`,
                      },
                      {
                        title: '4xx Errors',
                        description: `${(selectedNode as any).metrics.errors4xx?.toLocaleString()} (${(
                          (((selectedNode as any).metrics.errors4xx ?? 0) /
                            ((selectedNode as any).metrics.requests ?? 1)) *
                          100
                        ).toFixed(2)}%)`,
                      },
                    ]}
                    compressed
                  />
                </>
              )}
            </>
          )}
        </>
      );
    }

    if (selectedEdge) {
      const edgeStyle = (selectedEdge as any).data?.style;
      return (
        <>
          <EuiTitle size="s">
            <h4>Connection Details</h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiDescriptionList
            listItems={[
              { title: 'Source', description: selectedEdge.source },
              { title: 'Target', description: selectedEdge.target },
              { title: 'Edge ID', description: selectedEdge.id },
              ...(edgeStyle
                ? [
                    {
                      title: 'Stroke Type',
                      description: edgeStyle.type ?? (edgeStyle.dashed ? 'dashed' : 'solid'),
                    },
                    {
                      title: 'Animation',
                      description:
                        edgeStyle.animationType ?? (edgeStyle.animated ? 'flow' : 'none'),
                    },
                    { title: 'Marker', description: edgeStyle.marker ?? 'arrowClosed' },
                    { title: 'Stroke Width', description: String(edgeStyle.strokeWidth ?? 2) },
                    { title: 'Color', description: edgeStyle.color ?? 'Default' },
                    { title: 'Label', description: edgeStyle.label ?? 'None' },
                  ]
                : []),
            ]}
            compressed
          />
        </>
      );
    }

    return (
      <EuiEmptyPrompt
        iconType="inspect"
        title={<h3>No selection</h3>}
        body={<p>Click on a node or edge to view details</p>}
      />
    );
  };

  const tabInfo = TAB_DESCRIPTIONS[activeTab];

  return (
    <div className="ateApp">
      <EuiFlexGroup gutterSize="m" style={{ height: '100%', padding: 16 }} direction="column">
        {/* Tabs */}
        <EuiFlexItem grow={false}>
          <EuiTabs>
            <EuiTab isSelected={activeTab === 'apmCards'} onClick={() => switchTab('apmCards')}>
              APM Cards
            </EuiTab>
            <EuiTab isSelected={activeTab === 'apmCircles'} onClick={() => switchTab('apmCircles')}>
              APM Circles
            </EuiTab>
            <EuiTab isSelected={activeTab === 'agentCards'} onClick={() => switchTab('agentCards')}>
              Agent Cards
            </EuiTab>
            <EuiTab isSelected={activeTab === 'traceMap'} onClick={() => switchTab('traceMap')}>
              Trace Map
            </EuiTab>
            <EuiTab isSelected={activeTab === 'features'} onClick={() => switchTab('features')}>
              Features
            </EuiTab>
          </EuiTabs>
        </EuiFlexItem>

        {/* Tab description + controls */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="m">
            <EuiFlexItem>
              <EuiTitle size="xs">
                <h3>{tabInfo.title}</h3>
              </EuiTitle>
              <EuiText size="s" color="subdued">
                <p>{tabInfo.description}</p>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonGroup
                legend="Layout direction"
                options={[
                  { id: 'LR', label: 'Left → Right' },
                  { id: 'TB', label: 'Top → Bottom' },
                ]}
                idSelected={direction}
                onChange={(id) => setDirection(id as 'LR' | 'TB')}
                buttonSize="compressed"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSwitch
                label="Minimap"
                checked={showMinimap}
                onChange={(e) => setShowMinimap(e.target.checked)}
                compressed
              />
            </EuiFlexItem>
            {(activeTab === 'apmCards' || activeTab === 'apmCircles') && (
              <EuiFlexItem grow={false}>
                <EuiSwitch
                  label="Show SLI/SLO"
                  checked={showSliSlo}
                  onChange={(e) => setShowSliSlo(e.target.checked)}
                  compressed
                />
              </EuiFlexItem>
            )}
            {activeTab === 'features' && (
              <EuiFlexItem grow={false}>
                <EuiSwitch
                  label="Hide legend"
                  checked={hideLegend}
                  onChange={(e) => setHideLegend(e.target.checked)}
                  compressed
                />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Map + Details */}
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="m" style={{ height: '100%' }}>
            <EuiFlexItem>
              <EuiPanel
                paddingSize="none"
                style={{ height: '100%', minHeight: 600, overflow: 'hidden' }}
              >
                <CelestialMap key={activeTab} {...mapProps[activeTab]} />
              </EuiPanel>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ width: 350 }}>
              <EuiPanel paddingSize="m" className="ateDetailsPanel">
                <EuiTitle size="xs">
                  <h3>Details</h3>
                </EuiTitle>
                <EuiSpacer size="s" />
                {renderDetailsContent()}
              </EuiPanel>
              <EuiSpacer size="m" />
              <EuiPanel paddingSize="m" className="ateEventLogPanel">
                <EuiTitle size="xs">
                  <h3>Event Log</h3>
                </EuiTitle>
                <EuiSpacer size="s" />
                <div className="ateLogEntries">
                  {eventLog.length > 0 ? (
                    eventLog.map((event, index) => (
                      <div key={index} className="ateLogEntry">
                        <EuiText size="s">{event}</EuiText>
                      </div>
                    ))
                  ) : (
                    <EuiText color="subdued" size="s" textAlign="center">
                      <p>
                        <em>No events yet. Try clicking nodes or edges!</em>
                      </p>
                    </EuiText>
                  )}
                </div>
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const renderApp = (element: HTMLElement) => {
  const root = ReactDOM.createRoot(element);
  root.render(<ApmTopologyExampleApp />);
  return () => root.unmount();
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPanel,
  EuiPanelProps,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiButton,
  EuiCheckbox,
  EuiTitle,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiPopover,
  EuiContextMenu,
  EuiIcon,
} from '@elastic/eui';
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Handle,
  Position,
  useReactFlow,
  MarkerType,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../../../../../../../data_explorer/public';
import '@xyflow/react/dist/style.css';
import './service_map.scss';
import { extractSpanDuration } from '../utils/span_data_utils';
import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';

interface SpanHit {
  spanId: string;
  parentSpanId: string;
  serviceName: string;
  durationInNanos: number;
  status?: {
    code: number;
    message: string;
  };
}

interface ServiceNodeData {
  label: string;
  spanCount: number;
  avgLatency: number;
  maxLatency: number;
  errorRate: number;
  color: string;
  maxValues?: {
    maxRequestRate: number;
    maxErrorRate: number;
    maxDuration: number;
  };
  [key: string]: unknown;
}

// Custom node type definition
type ServiceNodeType = Node<ServiceNodeData>;

// Metric display options
type MetricOption = 'duration' | 'errorRate' | 'requestRate';

// Format latency values - always display in milliseconds
const formatLatency = (nanos: number) => {
  const ms = nanos / 1000000;
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else if (ms >= 1) {
    return `${ms.toFixed(1)}ms`;
  } else {
    return `${ms.toFixed(2)}ms`;
  }
};

const ServiceNode = ({
  data,
  selectedMetrics,
  showDetails,
  onFocusService,
  onToggleDetails,
  openPopoverNodeId,
  setOpenPopoverNodeId,
  isSelected,
  isDarkMode,
}: {
  data: ServiceNodeData;
  selectedMetrics: MetricOption[];
  showDetails: boolean;
  onFocusService: (serviceName: string) => void;
  onToggleDetails: () => void;
  openPopoverNodeId: string | null;
  setOpenPopoverNodeId: (id: string | null) => void;
  isSelected?: boolean;
  isDarkMode: boolean;
}) => {
  const serviceColor = data.color;

  // Calculate intensity values based on max values
  const requestRateIntensity = data.spanCount / (data.maxValues?.maxRequestRate || 100);
  const errorRateIntensity = data.errorRate / (data.maxValues?.maxErrorRate || 0.1);
  const durationIntensity = data.avgLatency / (data.maxValues?.maxDuration || 1000000000); // 1s in nanos

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If this card's popover is already open, close it
    // Otherwise, close any open popover and open this one
    if (openPopoverNodeId === data.label) {
      setOpenPopoverNodeId(null);
    } else {
      setOpenPopoverNodeId(data.label);
    }
  };

  const closePopover = () => {
    setOpenPopoverNodeId(null);
  };

  const handleFocusClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Needed to override the resize container
    e.stopPropagation();
    onFocusService(data.label);
    closePopover();
  };

  const handleExpandCollapseClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Needed to override the resize container
    e.stopPropagation();
    onToggleDetails();
    closePopover();
  };

  const panels = [
    {
      id: 0,
      title: 'Options',
      items: [
        {
          name: i18n.translate('explore.serviceMap.popup.focusOnService', {
            defaultMessage: 'Focus on this service',
          }),
          icon: <EuiIcon type="magnifyWithPlus" />,
          onMouseDown: handleFocusClick,
        },
        {
          name: showDetails
            ? i18n.translate('explore.serviceMap.popup.collapseAllCards', {
                defaultMessage: 'Collapse all cards',
              })
            : i18n.translate('explore.serviceMap.popup.expandAllCards', {
                defaultMessage: 'Expand all cards',
              }),
          icon: <EuiIcon type={showDetails ? 'fold' : 'unfold'} />,
          onMouseDown: handleExpandCollapseClick,
        },
      ],
    },
  ];

  return (
    <EuiPopover
      button={
        <div style={{ position: 'relative' }}>
          <Handle type="target" position={Position.Left} className="exploreServiceNodeHandle" />
          {/* Style for the cards */}
          <div
            className={`exploreServiceCard ${
              isSelected ? 'exploreServiceCard--selected' : 'exploreServiceCard--default'
            }`}
            style={
              {
                '--service-color': serviceColor,
              } as React.CSSProperties
            }
            onClick={handleCardClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick({
                  stopPropagation: () => e.stopPropagation(),
                } as React.MouseEvent<HTMLDivElement>);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={i18n.translate('explore.serviceMap.serviceCard.ariaLabel', {
              defaultMessage: 'Service card for {serviceName}',
              values: { serviceName: data.label },
            })}
            data-test-subj="serviceMapCard"
          >
            {/* Service name */}
            <div className="exploreServiceCard__name">{data.label}</div>

            {/* Metric bars */}
            <div
              className={`exploreServiceCard__metrics ${
                showDetails
                  ? 'exploreServiceCard__metrics--withDetails'
                  : 'exploreServiceCard__metrics--withoutDetails'
              }`}
            >
              {selectedMetrics.includes('requestRate') && (
                <div
                  title={`Request Rate: ${data.spanCount}`}
                  className="exploreMetricBar"
                  style={{
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                  }}
                >
                  <div
                    className="exploreMetricBar__fill"
                    style={
                      {
                        '--fill-width': `${requestRateIntensity * 100}%`,
                        backgroundColor: `rgba(0, 0, 255, ${0.3 + requestRateIntensity * 0.7})`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              )}
              {selectedMetrics.includes('errorRate') && (
                <div
                  title={`Error Rate: ${(data.errorRate * 100).toFixed(1)}%`}
                  className="exploreMetricBar"
                  style={{
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  }}
                >
                  <div
                    className="exploreMetricBar__fill"
                    style={
                      {
                        '--fill-width': `${errorRateIntensity * 100}%`,
                        backgroundColor: `rgba(255, 0, 0, ${0.3 + errorRateIntensity * 0.7})`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              )}
              {selectedMetrics.includes('duration') && (
                <div
                  title={`Avg Duration: ${formatLatency(data.avgLatency)}`}
                  className="exploreMetricBar"
                  style={{
                    backgroundColor: 'rgba(128, 0, 128, 0.1)',
                  }}
                >
                  <div
                    className="exploreMetricBar__fill"
                    style={
                      {
                        '--fill-width': `${durationIntensity * 100}%`,
                        backgroundColor: `rgba(128, 0, 128, ${0.3 + durationIntensity * 0.7})`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              )}
            </div>

            {/* Metrics section - only shown when showDetails is true */}
            {showDetails && (
              <div className="exploreServiceCard__details">
                {/* Request rate */}
                {selectedMetrics.includes('requestRate') && (
                  <div className="exploreServiceCard__metricText">
                    Request rate: {data.spanCount}
                  </div>
                )}

                {/* Error rate */}
                {selectedMetrics.includes('errorRate') && (
                  <div
                    className={`exploreServiceCard__metricText ${
                      data.errorRate > 0 ? 'exploreServiceCard__metricText--error' : ''
                    }`}
                  >
                    Error rate: {(data.errorRate * 100).toFixed(1)}%
                  </div>
                )}

                {/* Latency metrics */}
                {selectedMetrics.includes('duration') && (
                  <div className="exploreServiceCard__metricText">
                    Avg duration: {formatLatency(data.avgLatency)}
                  </div>
                )}
              </div>
            )}
          </div>
          <Handle
            type="source"
            position={Position.Right}
            style={{ background: '#555', visibility: 'hidden' }}
          />
        </div>
      }
      isOpen={openPopoverNodeId === data.label}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downCenter"
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};

const nodeTypes = (
  selectedMetrics: MetricOption[],
  showDetails: boolean,
  onFocusService: (serviceName: string) => void,
  onToggleDetails: () => void,
  openPopoverNodeId: string | null,
  setOpenPopoverNodeId: (id: string | null) => void,
  selectedSpanService: string | null,
  isDarkMode: boolean
) => ({
  serviceNode: (props: { data: ServiceNodeData }) => (
    <ServiceNode
      data={props.data}
      selectedMetrics={selectedMetrics}
      showDetails={showDetails}
      onFocusService={onFocusService}
      onToggleDetails={onToggleDetails}
      openPopoverNodeId={openPopoverNodeId}
      setOpenPopoverNodeId={setOpenPopoverNodeId}
      isSelected={selectedSpanService === props.data.label}
      isDarkMode={isDarkMode}
    />
  ),
});

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: ServiceNodeType[], edges: Edge[]) => {
  // Always use horizontal layout (LR)
  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: 120,
    ranksep: 180,
    marginx: 60,
    marginy: 60,
  });

  // Clear previous graph
  dagreGraph.removeNode = dagreGraph.removeNode || (() => {});
  dagreGraph.removeEdge = dagreGraph.removeEdge || (() => {});

  // Remove existing nodes and edges safely
  try {
    nodes.forEach((node) => {
      if (dagreGraph.hasNode(node.id)) {
        dagreGraph.removeNode(node.id);
      }
    });
    edges.forEach((edge) => {
      if (dagreGraph.hasEdge(edge.source, edge.target)) {
        dagreGraph.removeEdge(edge.source, edge.target);
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Error removing nodes/edges:', e);
  }

  // Add nodes with proper dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 100 });
  });

  // Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: {
        x: nodeWithPosition.x - 90, // Center the node (width/2)
        y: nodeWithPosition.y - 50, // Center the node (height/2)
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const FlowComponent: React.FC<{
  initialNodes: ServiceNodeType[];
  initialEdges: Edge[];
  serviceOptions: Array<EuiComboBoxOptionOption<string>>;
  selectedServiceOption: Array<EuiComboBoxOptionOption<string>>;
  onServiceSelection: (
    selectedOptions: Array<EuiComboBoxOptionOption<string>>,
    fitViewFn?: any
  ) => void;
  focusedService: string | null;
  selectedMetrics: MetricOption[];
  onMetricsChange: (metrics: MetricOption[]) => void;
  showDetails: boolean;
  onToggleDetails: () => void;
  isRefocusing: boolean;
  selectedSpanService: string | null;
  isDarkMode: boolean;
}> = ({
  initialNodes,
  initialEdges,
  serviceOptions,
  selectedServiceOption,
  onServiceSelection,
  focusedService,
  selectedMetrics,
  onMetricsChange,
  showDetails,
  onToggleDetails,
  isRefocusing,
  selectedSpanService,
  isDarkMode,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ServiceNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [isLayoutLoading, setIsLayoutLoading] = useState<boolean>(true);
  const [openPopoverNodeId, setOpenPopoverNodeId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  // Update nodes and edges when initial values change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);

    // If there's a focused service, center the view on it
    if (focusedService && initialNodes.length > 0) {
      const focusedNode = initialNodes.find((node) => node.id === focusedService);
      if (focusedNode) {
        setTimeout(() => {
          fitView({
            padding: 0.5,
            nodes: [focusedNode],
            duration: 800, // Animation duration for smoother zoom
          });
        }, 100);
      }
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, focusedService, fitView]);

  // Apply layout automatically
  const applyLayout = useCallback(() => {
    if (!nodes || !edges || nodes.length === 0) return;

    // Show loading spinner
    setIsLayoutLoading(true);

    const layouted = getLayoutedElements(nodes, edges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);

    // Fit view after layout
    setTimeout(() => {
      fitView({
        padding: { top: 0.2, right: 0.6, bottom: 0.2, left: 0.2 },
        duration: 800, // Add animation duration for smoother zoom
      });
      setIsLayoutLoading(false);
    }, 100);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // Apply layout when nodes change
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      applyLayout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  // Fit view when nodes are loaded
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      setTimeout(() => {
        fitView({
          padding: { top: 0.2, right: 0.6, bottom: 0.2, left: 0.2 },
          duration: 800, // Add animation duration for smoother zoom
        });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitView, nodes.length]);

  return (
    <div className="exploreServiceMap">
      {isLayoutLoading && (
        <div className="exploreServiceMap__loadingOverlay">
          <EuiLoadingSpinner size="xl" />
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes(
          selectedMetrics,
          showDetails,
          (serviceName) =>
            onServiceSelection([{ label: serviceName, value: serviceName }], fitView),
          onToggleDetails,
          openPopoverNodeId,
          setOpenPopoverNodeId,
          selectedSpanService,
          isDarkMode
        )}
        connectionMode={ConnectionMode.Loose}
        fitView={false}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ background: isDarkMode ? '#1a1c20' : '#fafafa' }}
        proOptions={{ hideAttribution: true }}
        onPaneClick={() => {
          // Close any open popover when clicking on the background
          if (openPopoverNodeId) {
            setOpenPopoverNodeId(null);
          }
        }}
      >
        {/* Service focus panel */}
        <div className="exploreServiceFocusPanel">
          <div className="exploreServiceFocusPanel__content">
            <EuiComboBox
              placeholder={i18n.translate('explore.serviceMap.placeholder.focusOnService', {
                defaultMessage: 'Focus on service',
              })}
              singleSelection={{ asPlainText: true }}
              options={serviceOptions}
              selectedOptions={selectedServiceOption}
              onChange={(options) => onServiceSelection(options, fitView)}
              isClearable={true}
              data-test-subj="serviceMapFocusSelector"
              compressed
              isDisabled={isRefocusing}
            />
          </div>
        </div>

        {/* Metrics panel */}
        <div className="exploreMetricsPanel">
          <EuiTitle size="xxs">
            <h4>
              {i18n.translate('explore.serviceMap.title.metrics', {
                defaultMessage: 'Metrics',
              })}
            </h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <div
            role="group"
            aria-label={i18n.translate('explore.serviceMap.ariaLabel.selectMetrics', {
              defaultMessage: 'Select metrics to display',
            })}
          >
            <EuiCheckbox
              id="requestRate"
              label={i18n.translate('explore.serviceMap.checkbox.requestRate', {
                defaultMessage: 'Request Rate',
              })}
              checked={selectedMetrics.includes('requestRate')}
              onChange={() => {
                const newSelectedMetrics = [...selectedMetrics];
                const index = newSelectedMetrics.indexOf('requestRate');

                if (index === -1) {
                  // Add the metric if not already selected
                  newSelectedMetrics.push('requestRate');
                } else {
                  // Remove the metric if already selected, but ensure at least one metric is selected
                  if (newSelectedMetrics.length > 1) {
                    newSelectedMetrics.splice(index, 1);
                  }
                }

                onMetricsChange(newSelectedMetrics);
              }}
              data-test-subj="serviceMapMetricSelector-requestRate"
              compressed
            />

            <EuiSpacer size="xs" />

            <EuiCheckbox
              id="errorRate"
              label={i18n.translate('explore.serviceMap.checkbox.errorRate', {
                defaultMessage: 'Error Rate',
              })}
              checked={selectedMetrics.includes('errorRate')}
              onChange={() => {
                const newSelectedMetrics = [...selectedMetrics];
                const index = newSelectedMetrics.indexOf('errorRate');

                if (index === -1) {
                  // Add the metric if not already selected
                  newSelectedMetrics.push('errorRate');
                } else {
                  // Remove the metric if already selected, but ensure at least one metric is selected
                  if (newSelectedMetrics.length > 1) {
                    newSelectedMetrics.splice(index, 1);
                  }
                }

                onMetricsChange(newSelectedMetrics);
              }}
              data-test-subj="serviceMapMetricSelector-errorRate"
              compressed
            />

            <EuiSpacer size="xs" />

            <EuiCheckbox
              id="duration"
              label={i18n.translate('explore.serviceMap.checkbox.duration', {
                defaultMessage: 'Duration',
              })}
              checked={selectedMetrics.includes('duration')}
              onChange={() => {
                const newSelectedMetrics = [...selectedMetrics];
                const index = newSelectedMetrics.indexOf('duration');

                if (index === -1) {
                  // Add the metric if not already selected
                  newSelectedMetrics.push('duration');
                } else {
                  // Remove the metric if already selected, but ensure at least one metric is selected
                  if (newSelectedMetrics.length > 1) {
                    newSelectedMetrics.splice(index, 1);
                  }
                }

                onMetricsChange(newSelectedMetrics);
              }}
              data-test-subj="serviceMapMetricSelector-duration"
              compressed
            />
          </div>

          {/* Gradient legends */}
          <div className="exploreMetricsPanel__legends">
            {selectedMetrics.includes('requestRate') && (
              <div className="exploreMetricsPanel__legendItem">
                <div className="exploreMetricsPanel__legendTitle">
                  {i18n.translate('explore.serviceMap.legend.requestRate', {
                    defaultMessage: 'Request Rate',
                  })}
                </div>
                <div
                  className="exploreMetricsPanel__legendGradient"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(0, 0, 255, 0.2), rgba(0, 0, 255, 0.9))',
                  }}
                />
                <div className="exploreMetricsPanel__legendLabels">
                  <span>0</span>
                  <span>
                    {initialNodes.length > 0
                      ? initialNodes[0].data.maxValues?.maxRequestRate || 'High'
                      : 'High'}
                  </span>
                </div>
              </div>
            )}

            {selectedMetrics.includes('errorRate') && (
              <div className="exploreMetricsPanel__legendItem">
                <div className="exploreMetricsPanel__legendTitle">
                  {i18n.translate('explore.serviceMap.legend.errorRate', {
                    defaultMessage: 'Error Rate',
                  })}
                </div>
                <div
                  className="exploreMetricsPanel__legendGradient"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(255, 0, 0, 0.2), rgba(255, 0, 0, 0.9))',
                  }}
                />
                <div className="exploreMetricsPanel__legendLabels">
                  <span>0%</span>
                  <span>
                    {initialNodes.length > 0
                      ? `${(initialNodes[0].data.maxValues?.maxErrorRate || 0.1) * 100}%`
                      : '10%+'}
                  </span>
                </div>
              </div>
            )}

            {selectedMetrics.includes('duration') && (
              <div className="exploreMetricsPanel__legendItem">
                <div className="exploreMetricsPanel__legendTitle">
                  {i18n.translate('explore.serviceMap.legend.duration', {
                    defaultMessage: 'Duration',
                  })}
                </div>
                <div
                  className="exploreMetricsPanel__legendGradient"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(128, 0, 128, 0.2), rgba(128, 0, 128, 0.9))',
                  }}
                />
                <div className="exploreMetricsPanel__legendLabels">
                  <span>0</span>
                  <span>
                    {initialNodes.length > 0
                      ? formatLatency(initialNodes[0].data.maxValues?.maxDuration || 0)
                      : 'Slow'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Show/Hide Details Button */}
          <EuiSpacer size="s" />
          <EuiButton
            size="s"
            onClick={onToggleDetails}
            fullWidth
            color="primary"
            data-test-subj="serviceMapToggleDetails"
          >
            {showDetails
              ? i18n.translate('explore.serviceMap.button.collapseCards', {
                  defaultMessage: 'Collapse cards',
                })
              : i18n.translate('explore.serviceMap.button.expandCards', {
                  defaultMessage: 'Expand cards',
                })}
          </EuiButton>
        </div>

        <Controls
          position="bottom-left"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          className="exploreServiceMapControls"
        />
        <Background color="#e8e8e8" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
};

export type ServiceMap = {
  hits: SpanHit[];
  colorMap?: Record<string, string>;
  selectedSpanId?: string;
} & Partial<EuiPanelProps>;

export const ServiceMap: React.FC<ServiceMap> = ({
  hits,
  colorMap = {},
  selectedSpanId,
  ...panelProps
}) => {
  const { services: dashboardServices } = useOpenSearchDashboards<DataExplorerServices>();
  const isDarkMode = dashboardServices?.uiSettings?.get('theme:darkMode') || false;

  const [focusedService, setFocusedService] = useState<string | null>(null);
  const [serviceOptions, setServiceOptions] = useState<Array<EuiComboBoxOptionOption<string>>>([]);
  const [selectedServiceOption, setSelectedServiceOption] = useState<
    Array<EuiComboBoxOptionOption<string>>
  >([]);
  const [isRefocusing, setIsRefocusing] = useState<boolean>(false);

  // State for metrics display
  const [selectedMetrics, setSelectedMetrics] = useState<MetricOption[]>([
    'requestRate',
    'errorRate',
    'duration',
  ]);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Find the service that contains the selected span
  const selectedSpanService = useMemo(() => {
    if (!selectedSpanId || !hits || hits.length === 0) return null;

    const selectedSpan = hits.find((hit) => hit.spanId === selectedSpanId);
    return selectedSpan ? resolveServiceNameFromSpan(selectedSpan) : null;
  }, [selectedSpanId, hits]);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!hits || hits.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Build service relationships from spans
    const id2svc = new Map<string, string>();
    const serviceSpanCounts = new Map<string, number>();
    const serviceLatencies = new Map<string, number[]>();

    hits.forEach((h) => {
      const { spanId } = h;
      const serviceName = resolveServiceNameFromSpan(h) || h.serviceName;
      const duration = extractSpanDuration(h);
      id2svc.set(spanId, serviceName);
      serviceSpanCounts.set(serviceName, (serviceSpanCounts.get(serviceName) || 0) + 1);

      // Collect latencies for each service
      if (!serviceLatencies.has(serviceName)) {
        serviceLatencies.set(serviceName, []);
      }
      serviceLatencies.get(serviceName)!.push(duration);
    });

    const svcSet = new Set<string>();
    const edgeSet = new Set<string>();

    hits.forEach((h) => {
      const { spanId, parentSpanId } = h;
      const serviceName = resolveServiceNameFromSpan(h) || h.serviceName;
      svcSet.add(serviceName);

      if (parentSpanId && id2svc.has(parentSpanId)) {
        const parentService = id2svc.get(parentSpanId)!;
        const childService = serviceName;

        // Only add edge if services are different
        if (parentService !== childService) {
          edgeSet.add(`${parentService}->${childService}`);
        }
      }
    });

    // Find max values across all services
    const services = Array.from(svcSet);
    let maxRequestRate = 0;
    let maxErrorRate = 0;
    let maxDuration = 0;

    services.forEach((service) => {
      const spanCount = serviceSpanCounts.get(service) || 0;
      maxRequestRate = Math.max(maxRequestRate, spanCount);

      const serviceSpans = hits.filter(
        (h) => (resolveServiceNameFromSpan(h) || h.serviceName) === service
      );
      const errorCount = serviceSpans.filter((h) => h.status?.code === 2).length;
      const errorRate = serviceSpans.length > 0 ? errorCount / serviceSpans.length : 0;
      maxErrorRate = Math.max(maxErrorRate, errorRate);

      const latencies = serviceLatencies.get(service) || [0];
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      maxDuration = Math.max(maxDuration, avgLatency);
    });

    // Create nodes with horizontal layout positioning
    const nodes: ServiceNodeType[] = services.map((service, index) => {
      const latencies = serviceLatencies.get(service) || [0];
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      const serviceSpans = hits.filter(
        (h) => (resolveServiceNameFromSpan(h) || h.serviceName) === service
      );
      const errorCount = serviceSpans.filter((h) => h.status?.code === 2).length;
      const errorRate = serviceSpans.length > 0 ? errorCount / serviceSpans.length : 0;

      return {
        id: service,
        type: 'serviceNode',
        position: {
          x: index * 220, // Horizontal spacing
          y: 0,
        },
        data: {
          label: service,
          spanCount: serviceSpanCounts.get(service) || 0,
          avgLatency: Math.round(avgLatency),
          maxLatency: Math.round(maxLatency),
          errorRate,
          color: colorMap[service],
          maxValues: {
            maxRequestRate,
            maxErrorRate,
            maxDuration,
          },
        },
      };
    });

    // Create edges
    const edges: Edge[] = Array.from(edgeSet).map((edgeStr) => {
      const [source, target] = edgeStr.split('->');
      return {
        id: `${source}-${target}`,
        source,
        target,
        type: 'default', // Use default for bezier curves
        animated: false,
        style: {
          strokeWidth: 2,
          stroke: '#999',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#999',
          width: 20,
          height: 20,
        },
      };
    });

    // Apply horizontal layout if we have nodes
    if (nodes.length > 0) {
      const layouted = getLayoutedElements(nodes, edges);
      return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [hits, colorMap]);

  const nodesAndEdges = useMemo(() => {
    if (!focusedService || initialNodes.length === 0) {
      return { filteredNodes: initialNodes, filteredEdges: initialEdges };
    }

    // Find directly connected services (both incoming and outgoing)
    const connectedServices = new Set<string>([focusedService]);

    initialEdges.forEach((edge: Edge) => {
      if (edge.source === focusedService) {
        connectedServices.add(edge.target as string);
      }
      if (edge.target === focusedService) {
        connectedServices.add(edge.source as string);
      }
    });

    // Filter nodes to only include the focused service and directly connected services
    const nodes = initialNodes.filter((node: ServiceNodeType) => connectedServices.has(node.id));

    // Filter edges to only include connections between the filtered nodes
    const edges = initialEdges.filter(
      (edge: Edge) =>
        connectedServices.has(edge.source as string) && connectedServices.has(edge.target as string)
    );

    return { filteredNodes: nodes, filteredEdges: edges };
  }, [focusedService, initialNodes, initialEdges]);

  const { filteredNodes, filteredEdges } = nodesAndEdges;

  // Update service options when nodes change or when filtered nodes change
  useEffect(() => {
    // When a service is focused, only show the currently visible services in the dropdown
    const nodesToUse = focusedService ? filteredNodes : initialNodes;

    if (nodesToUse.length > 0) {
      const options = nodesToUse.map((node: ServiceNodeType) => ({
        label: node.id,
        value: node.id,
      }));
      setServiceOptions(options);
    }
  }, [initialNodes, filteredNodes, focusedService]);

  // Handle service selection
  const handleServiceSelection = (
    selectedOptions: Array<EuiComboBoxOptionOption<string>>,
    fitViewFn?: any
  ) => {
    setSelectedServiceOption(selectedOptions);

    // Disable the dropdown during layout recalculation
    setIsRefocusing(true);

    if (selectedOptions.length > 0 && selectedOptions[0].value) {
      setFocusedService(selectedOptions[0].value);

      // Find the node for the selected service
      const selectedNode = initialNodes.find((node) => node.id === selectedOptions[0].value);
      if (selectedNode && fitViewFn) {
        // Center the view on the selected node with a slight delay to allow for filtering
        setTimeout(() => {
          fitViewFn({
            padding: 0.5,
            nodes: [selectedNode],
            duration: 800, // Add animation duration for smoother zoom
          });
          // Re-enable the dropdown after layout is complete
          setIsRefocusing(false);
        }, 200);
      }
    } else {
      setFocusedService(null);
      // Reset view to show all nodes
      if (fitViewFn) {
        // Immediate feedback for clearing focus
        setTimeout(() => {
          fitViewFn({
            padding: { top: 0.2, right: 0.6, bottom: 0.2, left: 0.2 },
            duration: 800, // Add animation duration for smoother zoom
          });
          // Re-enable the dropdown after layout is complete
          setIsRefocusing(false);
        }, 200);
      }
    }
  };

  if (!hits || hits.length === 0) {
    return (
      <EuiPanel {...panelProps}>
        <div className="exploreServiceMap__emptyState">
          {i18n.translate('explore.serviceMap.emptyState.noTraceData', {
            defaultMessage: 'No trace data available',
          })}
        </div>
      </EuiPanel>
    );
  }

  if (initialNodes.length === 0) {
    return (
      <EuiPanel {...panelProps}>
        <div className="exploreServiceMap__emptyState">
          {i18n.translate('explore.serviceMap.emptyState.noServicesFound', {
            defaultMessage: 'No services found in trace data',
          })}
        </div>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel {...panelProps}>
      <div className="exploreServiceMap__container">
        <ReactFlowProvider>
          <FlowComponent
            initialNodes={filteredNodes}
            initialEdges={filteredEdges}
            serviceOptions={serviceOptions}
            selectedServiceOption={selectedServiceOption}
            onServiceSelection={handleServiceSelection}
            focusedService={focusedService}
            selectedMetrics={selectedMetrics}
            onMetricsChange={setSelectedMetrics}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails(!showDetails)}
            isRefocusing={isRefocusing}
            selectedSpanService={selectedSpanService}
            isDarkMode={isDarkMode}
          />
        </ReactFlowProvider>
      </div>
    </EuiPanel>
  );
};

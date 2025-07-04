/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  EuiPanel,
  EuiPanelProps,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiButton,
  EuiButtonGroup,
  EuiCheckbox,
  EuiTitle,
  EuiSpacer,
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
import '@xyflow/react/dist/style.css';

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

// Define node data interface for better type safety
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
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
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

// Custom service node component
const ServiceNode = ({
  data,
  selectedMetrics,
  showDetails,
}: {
  data: ServiceNodeData;
  selectedMetrics: MetricOption[];
  showDetails: boolean;
}) => {
  const serviceColor = data.color;

  // Calculate intensity values based on max values
  const requestRateIntensity = data.spanCount / (data.maxValues?.maxRequestRate || 100);
  const errorRateIntensity = data.errorRate / (data.maxValues?.maxErrorRate || 0.1);
  const durationIntensity = data.avgLatency / (data.maxValues?.maxDuration || 1000000000); // 1s in nanos

  return (
    <div style={{ position: 'relative' }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', visibility: 'hidden' }}
      />
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '8px',
          background: 'white',
          color: '#333',
          border: `2px solid ${serviceColor}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minWidth: '180px',
          textAlign: 'left',
          fontSize: '14px',
          fontWeight: '500',
          position: 'relative',
        }}
      >
        {/* Service name with metric bars */}
        <div style={{ display: 'flex', marginBottom: showDetails ? '8px' : '0' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#232F3E',
              lineHeight: '1.2',
              flexGrow: 1,
            }}
          >
            {data.label}
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                width: '20px',
                alignItems: 'center',
              }}
            >
              {selectedMetrics.includes('requestRate') && (
                <div
                  title={`Request Rate: ${data.spanCount}`}
                  style={{
                    width: '100%',
                    height: '6px',
                    position: 'relative',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                    borderRadius: '1px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${requestRateIntensity * 100}%`,
                      backgroundColor: `rgba(0, 0, 255, ${0.3 + requestRateIntensity * 0.7})`,
                      borderRadius: '1px',
                    }}
                  />
                </div>
              )}
              {selectedMetrics.includes('errorRate') && (
                <div
                  title={`Error Rate: ${(data.errorRate * 100).toFixed(1)}%`}
                  style={{
                    width: '100%',
                    height: '6px',
                    position: 'relative',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderRadius: '1px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${errorRateIntensity * 100}%`,
                      backgroundColor: `rgba(255, 0, 0, ${0.3 + errorRateIntensity * 0.7})`,
                      borderRadius: '1px',
                    }}
                  />
                </div>
              )}
              {selectedMetrics.includes('duration') && (
                <div
                  title={`Avg Duration: ${formatLatency(data.avgLatency)}`}
                  style={{
                    width: '100%',
                    height: '6px',
                    position: 'relative',
                    backgroundColor: 'rgba(128, 0, 128, 0.1)',
                    borderRadius: '1px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${durationIntensity * 100}%`,
                      backgroundColor: `rgba(128, 0, 128, ${0.3 + durationIntensity * 0.7})`,
                      borderRadius: '1px',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics section - only shown when showDetails is true */}
        {showDetails && (
          <div
            style={{
              borderTop: '1px solid #eee',
              paddingTop: '8px',
              marginTop: '8px',
            }}
          >
            {/* Request rate */}
            {selectedMetrics.includes('requestRate') && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px',
                }}
              >
                Request rate: {data.spanCount}
              </div>
            )}

            {/* Error rate */}
            {selectedMetrics.includes('errorRate') && (
              <div
                style={{
                  fontSize: '12px',
                  color: data.errorRate > 0 ? '#DE1B1B' : '#666',
                  marginBottom: '4px',
                }}
              >
                Error rate: {(data.errorRate * 100).toFixed(1)}%
              </div>
            )}

            {/* Latency metrics */}
            {selectedMetrics.includes('duration') && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px',
                }}
              >
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
  );
};

const nodeTypes = (selectedMetrics: MetricOption[], showDetails: boolean) => ({
  serviceNode: (props: { data: ServiceNodeData }) => (
    <ServiceNode data={props.data} selectedMetrics={selectedMetrics} showDetails={showDetails} />
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
    // Handle error silently or use a proper error handling mechanism
    // console.warn('Error removing nodes/edges:', e);
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
  onClearSelection: () => void;
  focusedService: string | null;
  selectedMetrics: MetricOption[];
  onMetricsChange: (metrics: MetricOption[]) => void;
  showDetails: boolean;
  onToggleDetails: () => void;
}> = ({
  initialNodes,
  initialEdges,
  serviceOptions,
  selectedServiceOption,
  onServiceSelection,
  onClearSelection,
  focusedService,
  selectedMetrics,
  onMetricsChange,
  showDetails,
  onToggleDetails,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ServiceNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
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
          });
        }, 100);
      }
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, focusedService, fitView]);

  // Apply horizontal layout automatically
  const applyLayout = useCallback(() => {
    if (!nodes || !edges || nodes.length === 0) return;

    const layouted = getLayoutedElements(nodes, edges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.2 });
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
        fitView({ padding: 0.2 });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitView, nodes.length]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes(selectedMetrics, showDetails)}
        connectionMode={ConnectionMode.Loose}
        fitView={false}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ background: '#fafafa' }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Service focus panel */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 5,
            background: 'white',
            padding: '8px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #ddd',
            width: '250px',
            display: 'flex',
          }}
        >
          <div style={{ flex: 1 }}>
            <EuiComboBox
              placeholder="Focus on service"
              singleSelection={{ asPlainText: true }}
              options={serviceOptions}
              selectedOptions={selectedServiceOption}
              onChange={(options) => onServiceSelection(options, fitView)}
              isClearable={true}
              data-test-subj="serviceMapFocusSelector"
              compressed
            />
          </div>
        </div>

        {/* Metrics panel */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 5,
            background: 'white',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #ddd',
            width: '180px', // Adjusted width for vertical layout
          }}
        >
          <EuiTitle size="xxs">
            <h4>Metrics</h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <div role="group" aria-label="Select metrics to display">
            <EuiCheckbox
              id="requestRate"
              label="Request Rate"
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
              label="Error Rate"
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
              label="Duration"
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
          <div style={{ marginTop: '12px' }}>
            {selectedMetrics.includes('requestRate') && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  Request Rate
                </div>
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    background:
                      'linear-gradient(to right, rgba(0, 0, 255, 0.2), rgba(0, 0, 255, 0.9))',
                    borderRadius: '3px',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#666',
                    marginTop: '2px',
                  }}
                >
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
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  Error Rate
                </div>
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    background:
                      'linear-gradient(to right, rgba(255, 0, 0, 0.2), rgba(255, 0, 0, 0.9))',
                    borderRadius: '3px',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#666',
                    marginTop: '2px',
                  }}
                >
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
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  Duration
                </div>
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    background:
                      'linear-gradient(to right, rgba(128, 0, 128, 0.2), rgba(128, 0, 128, 0.9))',
                    borderRadius: '3px',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#666',
                    marginTop: '2px',
                  }}
                >
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
            {showDetails ? 'Collapse cards' : 'Expand cards'}
          </EuiButton>
        </div>

        <Controls
          position="bottom-left"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
          }}
        />
        <Background color="#e8e8e8" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
};

export type ServiceMap = {
  hits: SpanHit[];
  colorMap?: Record<string, string>;
} & Partial<EuiPanelProps>;

export const ServiceMap: React.FC<ServiceMap> = ({ hits, colorMap = {}, ...panelProps }) => {
  // State for service focus functionality
  const [focusedService, setFocusedService] = useState<string | null>(null);
  const [serviceOptions, setServiceOptions] = useState<Array<EuiComboBoxOptionOption<string>>>([]);
  const [selectedServiceOption, setSelectedServiceOption] = useState<
    Array<EuiComboBoxOptionOption<string>>
  >([]);

  // State for metrics display
  const [selectedMetrics, setSelectedMetrics] = useState<MetricOption[]>([
    'requestRate',
    'errorRate',
    'duration',
  ]);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!hits || hits.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Build service relationships from spans
    const id2svc = new Map<string, string>();
    const serviceSpanCounts = new Map<string, number>();
    const serviceLatencies = new Map<string, number[]>();

    hits.forEach((h) => {
      const { spanId, serviceName, durationInNanos } = h;
      id2svc.set(spanId, serviceName);
      serviceSpanCounts.set(serviceName, (serviceSpanCounts.get(serviceName) || 0) + 1);

      // Collect latencies for each service
      if (!serviceLatencies.has(serviceName)) {
        serviceLatencies.set(serviceName, []);
      }
      serviceLatencies.get(serviceName)!.push(durationInNanos || 0);
    });

    const svcSet = new Set<string>();
    const edgeSet = new Set<string>();

    hits.forEach(({ spanId, parentSpanId, serviceName }) => {
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
      // Find max request rate
      const spanCount = serviceSpanCounts.get(service) || 0;
      maxRequestRate = Math.max(maxRequestRate, spanCount);

      // Find max error rate
      const serviceSpans = hits.filter((h) => h.serviceName === service);
      const errorCount = serviceSpans.filter((h) => h.status?.code === 2).length;
      const errorRate = serviceSpans.length > 0 ? errorCount / serviceSpans.length : 0;
      maxErrorRate = Math.max(maxErrorRate, errorRate);

      // Find max duration
      const latencies = serviceLatencies.get(service) || [0];
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      maxDuration = Math.max(maxDuration, avgLatency);
    });

    // Create nodes with horizontal layout positioning
    const nodes: ServiceNodeType[] = services.map((service, index) => {
      const latencies = serviceLatencies.get(service) || [0];
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      // Calculate error rate
      const serviceSpans = hits.filter((h) => h.serviceName === service);
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
        type: 'smoothstep',
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

    initialEdges.forEach((edge) => {
      if (edge.source === focusedService) {
        connectedServices.add(edge.target);
      }
      if (edge.target === focusedService) {
        connectedServices.add(edge.source);
      }
    });

    // Filter nodes to only include the focused service and directly connected services
    const nodes = initialNodes.filter((node) => connectedServices.has(node.id));

    // Filter edges to only include connections between the filtered nodes
    const edges = initialEdges.filter(
      (edge) => connectedServices.has(edge.source) && connectedServices.has(edge.target)
    );

    return { filteredNodes: nodes, filteredEdges: edges };
  }, [focusedService, initialNodes, initialEdges]);

  const { filteredNodes, filteredEdges } = nodesAndEdges;

  // Update service options when nodes change or when filtered nodes change
  useEffect(() => {
    // When a service is focused, only show the currently visible services in the dropdown
    const nodesToUse = focusedService ? filteredNodes : initialNodes;

    if (nodesToUse.length > 0) {
      const options = nodesToUse.map((node) => ({
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
          });
        }, 200);
      }
    } else {
      setFocusedService(null);
      // Reset view to show all nodes
      if (fitViewFn) {
        setTimeout(() => {
          fitViewFn({ padding: 0.2 });
        }, 200);
      }
    }
  };

  // Clear service selection
  const clearServiceSelection = () => {
    setSelectedServiceOption([]);
    setFocusedService(null);
  };

  if (!hits || hits.length === 0) {
    return (
      <EuiPanel {...panelProps}>
        <div
          style={{
            height: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            backgroundColor: '#fafafa',
          }}
        >
          No trace data available
        </div>
      </EuiPanel>
    );
  }

  if (initialNodes.length === 0) {
    return (
      <EuiPanel {...panelProps}>
        <div
          style={{
            height: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            backgroundColor: '#fafafa',
          }}
        >
          No services found in trace data
        </div>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel {...panelProps}>
      <div style={{ height: '500px', width: '100%' }}>
        <ReactFlowProvider>
          <FlowComponent
            initialNodes={filteredNodes}
            initialEdges={filteredEdges}
            serviceOptions={serviceOptions}
            selectedServiceOption={selectedServiceOption}
            onServiceSelection={handleServiceSelection}
            onClearSelection={clearServiceSelection}
            focusedService={focusedService}
            selectedMetrics={selectedMetrics}
            onMetricsChange={setSelectedMetrics}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails(!showDetails)}
          />
        </ReactFlowProvider>
      </div>
    </EuiPanel>
  );
};

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
import ELK from 'elkjs/lib/elk.bundled.js';
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

// Custom service node component
const ServiceNode = ({
  data,
  selectedMetrics,
  showDetails,
  onFocusService,
  onToggleDetails,
  openPopoverNodeId,
  setOpenPopoverNodeId,
}: {
  data: ServiceNodeData;
  selectedMetrics: MetricOption[];
  showDetails: boolean;
  onFocusService: (serviceName: string) => void;
  onToggleDetails: () => void;
  openPopoverNodeId: string | null;
  setOpenPopoverNodeId: (id: string | null) => void;
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

  const handleFocusClick = () => {
    onFocusService(data.label);
    closePopover();
  };

  const handleExpandCollapseClick = () => {
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
          onClick: handleFocusClick,
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
          onClick: handleExpandCollapseClick,
        },
      ],
    },
  ];

  return (
    <EuiPopover
      button={
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
              cursor: 'pointer',
            }}
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
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#232F3E',
                lineHeight: '1.2',
                marginBottom: '8px',
              }}
            >
              {data.label}
            </div>

            {/* Metric bars */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginBottom: showDetails ? '8px' : '0',
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
  setOpenPopoverNodeId: (id: string | null) => void
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
    />
  ),
});

// Initialize ELK
const elk = new ELK();

// ELK layout function
const getLayoutedElements = async (nodes: ServiceNodeType[], edges: Edge[]) => {
  // Create the ELK graph structure
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '75',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      'elk.margins': '30',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: 180,
      height: 140, // Height to account for expanded state
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  // Run the layout algorithm
  const elkLayout = await elk.layout(elkGraph);

  // Apply the layout to the nodes
  const layoutedNodes = nodes.map((node) => {
    const elkNode = elkLayout.children?.find((n) => n.id === node.id);
    if (!elkNode || elkNode.x === undefined || elkNode.y === undefined) {
      return node; // Return original node if ELK didn't provide a position
    }

    return {
      ...node,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: {
        x: elkNode.x,
        y: elkNode.y,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Synchronous wrapper for the async ELK layout function
const getLayoutedElementsSync = (nodes: ServiceNodeType[], edges: Edge[]) => {
  // For initial positioning, use a simple grid layout
  const GRID_SIZE = 250; // Space between nodes
  const GRID_COLS = Math.ceil(Math.sqrt(nodes.length)); // Number of columns in the grid

  const layoutedNodes = nodes.map((node, index) => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);

    return {
      ...node,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: {
        x: col * GRID_SIZE,
        y: row * GRID_SIZE,
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
  isRefocusing: boolean;
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
  isRefocusing,
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

    // Apply the ELK layout asynchronously
    getLayoutedElements(nodes, edges)
      .then((layouted) => {
        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);

        // Fit view after layout
        setTimeout(() => {
          fitView({
            padding: 0.2,
            duration: 800, // Add animation duration for smoother zoom
          });
          setIsLayoutLoading(false);
        }, 100);
      })
      .catch((error) => {
        // If ELK fails, use the grid layout as fallback
        const fallbackLayout = getLayoutedElementsSync(nodes, edges);
        setNodes([...fallbackLayout.nodes]);
        setEdges([...fallbackLayout.edges]);
        setIsLayoutLoading(false);
      });
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
          padding: 0.2,
          duration: 800, // Add animation duration for smoother zoom
        });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitView, nodes.length]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {isLayoutLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(250, 250, 250, 0.7)',
            zIndex: 10,
          }}
        >
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
          setOpenPopoverNodeId
        )}
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
          <div style={{ marginTop: '12px' }}>
            {selectedMetrics.includes('requestRate') && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  {i18n.translate('explore.serviceMap.legend.requestRate', {
                    defaultMessage: 'Request Rate',
                  })}
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
                  {i18n.translate('explore.serviceMap.legend.errorRate', {
                    defaultMessage: 'Error Rate',
                  })}
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
                  {i18n.translate('explore.serviceMap.legend.duration', {
                    defaultMessage: 'Duration',
                  })}
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

  const [isInitialLayoutLoading, setIsInitialLayoutLoading] = useState<boolean>(false);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!hits || hits.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Set loading state when generating new nodes
    setIsInitialLayoutLoading(true);

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

    // For initial display, just return the nodes with basic positioning
    // The actual layout will be applied when the component mounts
    return { initialNodes: nodes, initialEdges: edges };
  }, [hits, colorMap]);

  // Clear loading state when nodes are ready
  useEffect(() => {
    if (initialNodes.length > 0) {
      setIsInitialLayoutLoading(false);
    }
  }, [initialNodes]);

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

    // When clearing focus, immediately show the main loading spinner
    if (selectedOptions.length === 0) {
      setIsInitialLayoutLoading(true);
    }

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
            padding: 0.2,
            duration: 800, // Add animation duration for smoother zoom
          });
          // Re-enable the dropdown after layout is complete
          setIsRefocusing(false);
          setIsInitialLayoutLoading(false);
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
          {i18n.translate('explore.serviceMap.emptyState.noServicesFound', {
            defaultMessage: 'No services found in trace data',
          })}
        </div>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel {...panelProps}>
      <div style={{ height: '500px', width: '100%', position: 'relative' }}>
        {isInitialLayoutLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(250, 250, 250, 0.7)',
              zIndex: 5,
            }}
          >
            <EuiLoadingSpinner size="xl" />
          </div>
        )}
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
            isRefocusing={isRefocusing}
          />
        </ReactFlowProvider>
      </div>
    </EuiPanel>
  );
};

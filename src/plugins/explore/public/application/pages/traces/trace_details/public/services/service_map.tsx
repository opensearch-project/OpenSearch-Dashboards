/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { EuiPanel, EuiPanelProps } from '@elastic/eui';
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
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
}

// Custom node type definition
type ServiceNodeType = Node<ServiceNodeData>;

// Custom service node component
const ServiceNode = ({ data }: { data: ServiceNodeData }) => {
  const serviceColor = data.color;

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

        {/* Metrics section */}
        <div
          style={{
            borderTop: '1px solid #eee',
            paddingTop: '8px',
            marginTop: '8px',
          }}
        >
          {/* Request rate */}
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '4px',
            }}
          >
            Request rate: {data.spanCount}
          </div>

          {/* Latency metrics */}
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '2px',
            }}
          >
            Avg: {formatLatency(data.avgLatency)}
          </div>

          <div
            style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '4px',
            }}
          >
            Max: {formatLatency(data.maxLatency)}
          </div>

          {/* Error rate */}
          <div
            style={{
              fontSize: '12px',
              color: data.errorRate > 0 ? '#DE1B1B' : '#666',
            }}
          >
            Error rate: {(data.errorRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555', visibility: 'hidden' }}
      />
    </div>
  );
};

const nodeTypes: Record<string, React.FC<{ data: ServiceNodeData }>> = {
  serviceNode: ServiceNode,
};

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
}> = ({ initialNodes, initialEdges }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ServiceNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const { fitView } = useReactFlow();

  // Update nodes and edges when initial values change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

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
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView={false}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ background: '#fafafa' }}
      >
        <Controls
          position="top-left"
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

    // Create nodes with horizontal layout positioning
    const services = Array.from(svcSet);
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

  // Show a message if no data
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

  // Show a message if no nodes were created
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
          <FlowComponent initialNodes={initialNodes} initialEdges={initialEdges} />
        </ReactFlowProvider>
      </div>
    </EuiPanel>
  );
};

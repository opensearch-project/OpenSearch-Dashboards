/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, PropsWithChildren, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFitViewWithDelay } from '../hooks/use_fit_view_with_delay.hook';
import type { CelestialCardProps } from '../../components/celestial_card';
import { useCelestialStateContext } from './celestial_state_context';

interface CelestialNodeActionsType {
  selectedNodeId?: string;
  onGroupToggle?: (event: React.MouseEvent, node: CelestialCardProps) => void;
  onDashboardClick?: (event: React.MouseEvent, node: CelestialCardProps) => void;
  onUnstackNode?: (event: React.MouseEvent, node: CelestialCardProps) => void;
  onStackNode?: (event: React.MouseEvent, node: CelestialCardProps) => void;
}

interface CelestialNodeActionsProviderProps {
  onDataFetch?: (node?: CelestialCardProps) => void;
  addBreadcrumb?: (title: string, node?: CelestialCardProps) => void;
  onDashboardClick?: (node?: CelestialCardProps) => void;
  onUnstackNode?: (stackedNodeId: string) => void;
}
const CelestialNodeActions = createContext<CelestialNodeActionsType | undefined>(undefined);

export const CelestialNodeActionsProvider: React.FC<PropsWithChildren<
  CelestialNodeActionsProviderProps
>> = ({ onDataFetch, addBreadcrumb, onDashboardClick, children }) => {
  // Track the selected node ID
  const fitViewWithDelay = useFitViewWithDelay();
  const {
    selectedNodeId,
    setSelectedNodeId,
    unstackedAggregateNodeIds,
    setUnstackedAggregateNodeIds,
  } = useCelestialStateContext();
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();

  const onGroupToggle = useCallback(
    (event: React.MouseEvent, props: CelestialCardProps) => {
      event.stopPropagation();
      const groupId = props.id;
      addBreadcrumb?.(props.title || groupId, props);
      onDataFetch?.(props);
      setSelectedNodeId(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDataFetch, addBreadcrumb]
  );

  const handleDashboardClick = useCallback(
    (event: React.MouseEvent, props: CelestialCardProps) => {
      onDashboardClick?.(props);
      if (onDashboardClick) {
        fitViewWithDelay();
      }
    },
    [onDashboardClick, fitViewWithDelay]
  );

  // Create onClick handler for unstacking nodes
  const onUnstackNode = useCallback(
    (event: React.MouseEvent, props: CelestialCardProps) => {
      event.stopPropagation();

      if (!props.aggregatedNodeId) return;

      // Find the stacked node and get its stackedNodeIds
      const nodes = getNodes() ?? [];
      const edges = getEdges() ?? [];
      const hasStackedNodes = nodes.some((node) => {
        return node.data.aggregatedNodeId === props.aggregatedNodeId && node.hidden === true;
      });

      if (!hasStackedNodes) return;

      const updatedNodeIds: string[] = [];
      // Find the individual nodes that were stacked
      const updatedNodes = nodes.map((node) => {
        if (node.data.aggregatedNodeId === props.aggregatedNodeId) {
          updatedNodeIds.push(node.id);
          return {
            ...node,
            hidden: false,
          };
        }

        return node;
      });

      const updatedEdges = edges.map((edge) => {
        if (updatedNodeIds.includes(edge.source) || updatedNodeIds.includes(edge.target)) {
          return {
            ...edge,
            hidden: false,
          };
        }

        return edge;
      });

      // Handle edges: restore hidden edges and hide stacked edge
      setUnstackedAggregateNodeIds([
        ...unstackedAggregateNodeIds,
        props.aggregatedNodeId as string,
      ]);
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setNodes, setEdges, unstackedAggregateNodeIds, setUnstackedAggregateNodeIds]
  );

  const onStackNode = useCallback(
    (event: React.MouseEvent, props: CelestialCardProps) => {
      event.preventDefault();

      if (!props.aggregatedNodeId) return;

      const nodes = getNodes() ?? [];
      const edges = getEdges() ?? [];

      const hasNodesToStack = nodes.some((node) => {
        return node.data.aggregatedNodeId === props.aggregatedNodeId && node.id !== props.id;
      });

      if (!hasNodesToStack) return;

      // Find the unstacked parent node
      const unStackedNodes = nodes
        .filter((node) => node.data.aggregateId === props.aggregatedNodeId && props.id !== node.id)
        .map((node) => node.id);

      const updatedNodes = nodes.map((node) => {
        if (unStackedNodes.includes(node.id)) {
          return {
            ...node,
            hidden: true,
          };
        }

        return node;
      });

      const updateEdges = edges.map((edge) => {
        if (unStackedNodes.includes(edge.source) || unStackedNodes.includes(edge.target)) {
          return {
            ...edge,
            hidden: true,
          };
        }

        return edge;
      });

      setNodes(updatedNodes);
      setEdges(updateEdges);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setNodes, setEdges]
  );

  return (
    <CelestialNodeActions.Provider
      value={{
        selectedNodeId,
        onGroupToggle,
        onDashboardClick: handleDashboardClick,
        onUnstackNode,
        onStackNode,
      }}
    >
      {children}
    </CelestialNodeActions.Provider>
  );
};

export const useCelestialNodeActionsContext = () => {
  const context = useContext(CelestialNodeActions);
  if (context === undefined) {
    throw new Error(
      'useCelestialNodeActionsContext must be used within a CelestialNodeActionsProvider'
    );
  }
  return context;
};

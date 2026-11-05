/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useRef, useState } from 'react';
import { useMapInitialization } from './shared/hooks/use_map_initialization.hook';
import { useCelestialStateContext } from './shared/contexts/celestial_state_context';
import './celestial.scss';
import { useBreadcrumbs } from './components/breadcrumb_trail';
import { MapContainer } from './components/map_container';
import { CelestialNodeActionsProvider } from './shared/contexts/node_actions_context';
import { useCelestialLayout } from './shared/hooks/use_celestial_layout.hook';
import { useCelestialMapActions } from './shared/hooks/use_celestial_map_actions.hook';
import { useFitViewWithDelay } from './shared/hooks/use_fit_view_with_delay.hook';
import { useFocusOnNodes } from './shared/hooks/use_focus_on_nodes.hook';
import type { CelestialMapProps } from './types';
import { layoutSignature, reuseLayout } from './shared/utils/layout_reuse.utils';

/**
 * Detect whether the host page is in dark mode by reading the computed
 * color-scheme on :root. OSD sets :root { color-scheme: dark|light } at
 * bootstrap time based on the user's theme preference.
 */
const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return getComputedStyle(document.documentElement).colorScheme === 'dark';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(getComputedStyle(document.documentElement).colorScheme === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  // Sync dark mode class to document.documentElement so CSS rules can reach
  // portal-rendered content (e.g. LegendPanel) that lives outside .celestial.
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('celestial--dark');
    } else {
      root.classList.remove('celestial--dark');
    }
    return () => root.classList.remove('celestial--dark');
  }, [isDark]);

  return isDark;
};

export const Celestial = (props: CelestialMapProps) => {
  const isDarkMode = useIsDarkMode();
  const { minZoom, maxZoom, padding } = props.fitViewOptions ?? {};
  const fitViewWithDelay = useFitViewWithDelay(undefined, padding, undefined, {
    minZoom,
    maxZoom,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const { focusOnNodes } = useFocusOnNodes();
  const { viewLock } = useCelestialStateContext();

  // Pass the layout options from props to the hook
  const { getLaidOutElements } = useCelestialLayout(props.layoutOptions);

  // Replace the current static initialization with a reactive approach
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  const { setSelectedNodeId } = useCelestialStateContext();

  // Stack aggregated nodes and focus other nodes
  const map = useMapInitialization(
    props.map?.root?.nodes,
    props.map?.root?.edges,
    props.nodesInFocus,
    props.topN
  );

  // focus on selected nodeid
  useEffect(() => {
    setSelectedNodeId(props.selectedNodeId);
    if (props.selectedNodeId) {
      const selectedNode = nodes.find((node) => node.id === props.selectedNodeId);
      if (selectedNode && !selectedNode.hidden) {
        focusOnNodes([selectedNode], nodes);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedNodeId, nodes, focusOnNodes]);

  // Lay out once per change of the layout inputs. Node data changes (e.g. metrics arriving)
  // reuse the previous positions instead of re-running dagre, which takes seconds on large
  // maps, and leave the viewport where it is.
  const lastLayout = useRef<{
    signature: string;
    getLaidOutElements: typeof getLaidOutElements;
    result: ReturnType<typeof getLaidOutElements>;
  } | null>(null);
  const lastNodesInFocus = useRef(props.nodesInFocus);
  useEffect(() => {
    if (!map.nodes) return;
    const edgesIn = map.edges ?? [];
    const signature = layoutSignature(map.nodes, edgesIn);
    const prev = lastLayout.current;
    const reusable =
      prev && prev.signature === signature && prev.getLaidOutElements === getLaidOutElements
        ? prev
        : null;
    const reuse = !!reusable;
    const layoutResult = reusable
      ? reuseLayout(reusable.result, map.nodes, edgesIn)
      : getLaidOutElements(map.nodes, edgesIn);
    lastLayout.current = { signature, getLaidOutElements, result: layoutResult };
    setNodes(layoutResult.nodes);
    setEdges(layoutResult.edges);

    const focusChanged = lastNodesInFocus.current !== props.nodesInFocus;
    lastNodesInFocus.current = props.nodesInFocus;
    if (reuse && !focusChanged) return;
    if (props.nodesInFocus?.length) {
      focusOnNodes(props.nodesInFocus, layoutResult.nodes);
    } else if (!viewLock.isLocked()) {
      fitViewWithDelay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map.nodes,
    map.edges,
    getLaidOutElements,
    focusOnNodes,
    fitViewWithDelay,
    props.nodesInFocus,
  ]);

  // Re-fit when the container is resized (e.g. an embedded map in a resizable panel).
  useEffect(() => {
    const container = containerRef.current;
    if (!props.refitOnResize || !container || typeof ResizeObserver === 'undefined') return;
    // Only on a real size change: a new observer reports the current size once on observe().
    let lastSize = '';
    const observer = new ResizeObserver(([entry]) => {
      const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
      const changed = lastSize !== '' && size !== lastSize;
      lastSize = size;
      if (changed && !viewLock.isLocked()) fitViewWithDelay();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [props.refitOnResize, fitViewWithDelay, viewLock]);

  // Use breadcrumb props if provided, otherwise fall back to internal hook for backwards compatibility
  const internalBreadcrumbs = useBreadcrumbs();

  const breadcrumbs = props.breadcrumbs ?? internalBreadcrumbs.breadcrumbs;
  const addBreadcrumb = props.addBreadcrumb ?? internalBreadcrumbs.addBreadcrumb;
  const navigateToBreadcrumb =
    props.navigateToBreadcrumb ?? internalBreadcrumbs.navigateToBreadcrumb;

  const { onBreadcrumbClick, onEdgeClick } = useCelestialMapActions({
    onDataFetch: props.onDataFetch,
    navigateToBreadcrumb,
    onEdgeClick: props.onEdgeClick,
    onBreadcrumbClick: props.onBreadcrumbClick,
  });

  return (
    <CelestialNodeActionsProvider
      onDataFetch={props.onDataFetch}
      addBreadcrumb={addBreadcrumb}
      onDashboardClick={props.onDashboardClick}
    >
      <div
        ref={containerRef}
        className={`celContainer celestial reset${isDarkMode ? ' celestial--dark' : ''}`}
      >
        <div className="celMapContainer">
          <MapContainer
            isDarkMode={isDarkMode}
            isLoading={props.isLoading}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            breadcrumbs={breadcrumbs}
            onBreadcrumbClick={onBreadcrumbClick}
            onEdgeClick={onEdgeClick}
            emptyState={props.emptyState}
            hotspot={props.breadcrumbHotspot}
            numMatches={props.numMatchesForFilters}
            nodeTypes={props.nodeTypes}
            edgeTypes={props.edgeTypes}
            legend={props.legend}
            showMinimap={props.showMinimap}
            showGridBackground={props.showGridBackground}
            showSliSlo={props.showSliSlo}
            showLayoutControls={props.showLayoutControls}
            nodesDraggable={props.nodesDraggable}
            rootBreadcrumbIcon={props.rootBreadcrumbIcon}
            onNodeClickZoom={props.onNodeClickZoom}
            onEdgeClickZoom={props.onEdgeClickZoom}
          />
        </div>
      </div>
    </CelestialNodeActionsProvider>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import { CelestialNodes } from 'src/types';
import { useCelestialLayout } from '../../shared/hooks/use_celestial_layout.hook';
import { useCelestialStateContext } from '../../shared/contexts/celestial_state_context';

export interface LayoutControlsActions {
  onLayoutChange: (e: React.MouseEvent) => void;
  onExpandAll: (e: React.MouseEvent) => void;
}

export const useLayoutControls = (): LayoutControlsActions => {
  const { layoutOptions } = useCelestialStateContext();
  const { getLaidOutElements } = useCelestialLayout(layoutOptions);
  const { getNodes, setNodes, getEdges, setEdges, fitView } = useReactFlow();

  /**
   * Handler for zooming in the view
   * @param e Mouse event from zoom button click
   */
  const onLayoutChange = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const nodes = getNodes();
      const edges = getEdges();

      const layout = getLaidOutElements(nodes as CelestialNodes, edges);

      setNodes(layout.nodes);
      setEdges(layout.edges);
      fitView({ duration: 300 });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getLaidOutElements, getNodes, setNodes, getEdges, setEdges]
  );

  const onExpandAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const nodes = getNodes().map((node) => ({ ...node, hidden: false }));
      const edges = getEdges().map((edge) => ({ ...edge, hidden: false }));

      const layout = getLaidOutElements(nodes as CelestialNodes, edges);

      setNodes(layout.nodes);
      setEdges(layout.edges);
      fitView({ duration: 300 });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getNodes, getEdges, setNodes, setEdges, fitView]
  );

  return {
    onLayoutChange,
    onExpandAll,
  };
};

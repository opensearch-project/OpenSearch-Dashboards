/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import Dagre from '@dagrejs/dagre';
import { CelestialMap } from './celestial_map';
import type { CelestialEdge, CelestialNode } from './types';

// The real layout hook (dagre spied), unlike celestial.test.tsx: this covers the options
// consumers pass inline, a new object on every render.
const mockFitView = jest.fn();
jest.mock('./shared/hooks/use_fit_view_with_delay.hook', () => ({
  useFitViewWithDelay: () => mockFitView,
}));
const mockFocusOnNodes = jest.fn();
jest.mock('./shared/hooks/use_focus_on_nodes.hook', () => ({
  useFocusOnNodes: () => ({ focusOnNodes: mockFocusOnNodes }),
}));
jest.mock('./components/map_container', () => ({ MapContainer: () => null }));

const node = (id: string, title = id): CelestialNode =>
  ({
    id,
    type: 'celestial',
    position: { x: 0, y: 0 },
    data: { id, title, keyAttributes: {} },
  }) as CelestialNode;
const edges = [{ id: 'e1', source: 'a', target: 'b' } as CelestialEdge];
const mapOf = (nodes: CelestialNode[]) => ({ root: { nodes, edges } });

describe('Celestial with inline layoutOptions', () => {
  let dagreLayout: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    dagreLayout = jest.spyOn(Dagre, 'layout');
  });
  afterEach(() => dagreLayout.mockRestore());

  it('a parent re-render with new but equal options neither lays out nor refits', () => {
    const nodes = [node('a'), node('b')];
    const { rerender } = render(
      <CelestialMap map={mapOf(nodes)} layoutOptions={{ direction: 'TB', rankSeparation: 80 }} />
    );
    expect(dagreLayout).toHaveBeenCalledTimes(1);
    expect(mockFitView).toHaveBeenCalledTimes(1);

    rerender(
      <CelestialMap map={mapOf(nodes)} layoutOptions={{ rankSeparation: 80, direction: 'TB' }} />
    );
    rerender(
      <CelestialMap
        map={mapOf([node('a', 'A: 5 req/s'), node('b')])}
        layoutOptions={{ direction: 'TB', rankSeparation: 80 }}
      />
    );
    expect(dagreLayout).toHaveBeenCalledTimes(1);
    expect(mockFitView).toHaveBeenCalledTimes(1);
  });

  it('changed option values lay out again, keeping the viewport', () => {
    const nodes = [node('a'), node('b')];
    const { rerender } = render(
      <CelestialMap map={mapOf(nodes)} layoutOptions={{ direction: 'TB' }} />
    );
    rerender(<CelestialMap map={mapOf(nodes)} layoutOptions={{ direction: 'LR' }} />);
    expect(dagreLayout).toHaveBeenCalledTimes(2);
    expect(mockFitView).toHaveBeenCalledTimes(1);
  });

  it('re-centers on the selected node when selected, not on data-only updates', () => {
    const { rerender } = render(<CelestialMap map={mapOf([node('a'), node('b')])} />);
    rerender(<CelestialMap map={mapOf([node('a'), node('b')])} selectedNodeId="a" />);
    expect(mockFocusOnNodes).toHaveBeenCalledTimes(1);

    rerender(<CelestialMap map={mapOf([node('a', 'A: 5 req/s'), node('b')])} selectedNodeId="a" />);
    expect(mockFocusOnNodes).toHaveBeenCalledTimes(1);

    // A new caller of `a` moves it down a rank: a new layout, so re-center.
    const moved = {
      root: {
        nodes: [node('a'), node('b'), node('c')],
        edges: [...edges, { id: 'e2', source: 'c', target: 'a' } as CelestialEdge],
      },
    };
    rerender(<CelestialMap map={moved} selectedNodeId="a" />);
    expect(mockFocusOnNodes).toHaveBeenCalledTimes(2);
  });
});

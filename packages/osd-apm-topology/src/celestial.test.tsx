/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { CelestialMap } from './celestial_map';
import type { CelestialEdge, CelestialNode } from './types';

const mockLayout = jest.fn((nodes: CelestialNode[], edges: CelestialEdge[]) => ({
  nodes: nodes.map((n, i) => ({ ...n, position: { x: i * 100, y: 0 } })),
  edges: edges.map((e) => ({ ...e, sourceHandle: 'source-right' })),
}));
jest.mock('./shared/hooks/use_celestial_layout.hook', () => ({
  useCelestialLayout: () => ({ getLaidOutElements: mockLayout }),
}));
const mockFitView = jest.fn();
jest.mock('./shared/hooks/use_fit_view_with_delay.hook', () => ({
  useFitViewWithDelay: () => mockFitView,
}));
const mockFocusOnNodes = jest.fn();
jest.mock('./shared/hooks/use_focus_on_nodes.hook', () => ({
  useFocusOnNodes: () => ({ focusOnNodes: mockFocusOnNodes }),
}));
let mockRendered: CelestialNode[] = [];
jest.mock('./components/map_container', () => ({
  MapContainer: (props: { nodes: CelestialNode[] }) => {
    mockRendered = props.nodes;
    return null;
  },
}));

const node = (id: string, title = id): CelestialNode =>
  ({
    id,
    type: 'celestial',
    position: { x: 0, y: 0 },
    data: { id, title, keyAttributes: {} },
  }) as CelestialNode;
const edges = [{ id: 'e1', source: 'a', target: 'b' } as CelestialEdge];
const mapOf = (nodes: CelestialNode[], e = edges) => ({ root: { nodes, edges: e } });

describe('Celestial layout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lays out once per change and fits the view', () => {
    render(<CelestialMap map={mapOf([node('a'), node('b')])} />);
    expect(mockLayout).toHaveBeenCalledTimes(1);
    expect(mockFitView).toHaveBeenCalledTimes(1);
  });

  it('reuses the layout when only node data changes, without refitting', () => {
    const { rerender } = render(<CelestialMap map={mapOf([node('a'), node('b')])} />);
    rerender(<CelestialMap map={mapOf([node('a', 'A: 5 req/s'), node('b')])} />);

    expect(mockLayout).toHaveBeenCalledTimes(1);
    expect(mockFitView).toHaveBeenCalledTimes(1);
    const a = mockRendered.find((n) => n.id === 'a');
    expect(a?.data.title).toBe('A: 5 req/s');
    expect(mockRendered.find((n) => n.id === 'b')?.position).toEqual({ x: 100, y: 0 });
  });

  it('lays out again when the structure changes', () => {
    const { rerender } = render(<CelestialMap map={mapOf([node('a'), node('b')])} />);
    rerender(<CelestialMap map={mapOf([node('a'), node('b'), node('c')])} />);
    rerender(<CelestialMap map={mapOf([node('a'), node('b'), node('c')], [])} />);
    expect(mockLayout).toHaveBeenCalledTimes(3);
    expect(mockFitView).toHaveBeenCalledTimes(3);
  });

  it('re-focuses when the focused nodes change, without a new layout', () => {
    const nodes = [node('a'), node('b')];
    const { rerender } = render(<CelestialMap map={mapOf(nodes)} />);
    const focus = [nodes[0]];
    rerender(<CelestialMap map={mapOf([node('a'), node('b')])} nodesInFocus={focus} />);
    expect(mockLayout).toHaveBeenCalledTimes(1);
    expect(mockFocusOnNodes).toHaveBeenCalledWith(focus, expect.any(Array));
  });
});

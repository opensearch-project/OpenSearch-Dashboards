/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useLayoutControls } from './use-layout-controls.hook';
// Mock React Flow
const mockGetNodes = jest.fn();
const mockSetNodes = jest.fn();
const mockGetEdges = jest.fn();
const mockSetEdges = jest.fn();
const mockFitView = jest.fn();

jest.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    getNodes: mockGetNodes,
    setNodes: mockSetNodes,
    getEdges: mockGetEdges,
    setEdges: mockSetEdges,
    fitView: mockFitView,
  }),
}));

// Mock Celestial Layout
const mockGetLaidOutElements = jest.fn();

jest.mock('../../shared/hooks/use-celestial-layout.hook', () => ({
  useCelestialLayout: () => ({
    getLaidOutElements: mockGetLaidOutElements,
  }),
}));

// Mock CelestialStateContext
jest.mock('../../shared/contexts/CelestialStateContext', () => ({
  useCelestialStateContext: () => ({
    layoutOptions: undefined,
  }),
}));

describe('useLayoutControls', () => {
  const mockNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 100, y: 100 }, data: { label: 'Node 2' }, hidden: true },
  ];

  const mockEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3', hidden: true },
  ];

  const mockLayoutResult = {
    nodes: [
      { id: '1', position: { x: 50, y: 50 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 150, y: 150 }, data: { label: 'Node 2' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodes.mockReturnValue(mockNodes);
    mockGetEdges.mockReturnValue(mockEdges);
    mockGetLaidOutElements.mockReturnValue(mockLayoutResult);
  });

  it('should return the correct interface', () => {
    const { result } = renderHook(() => useLayoutControls());

    expect(result.current).toEqual({
      onLayoutChange: expect.any(Function),
      onExpandAll: expect.any(Function),
    });
  });

  it('should handle layout change correctly', () => {
    const { result } = renderHook(() => useLayoutControls());
    const mockEvent = ({ stopPropagation: jest.fn() } as unknown) as React.MouseEvent;

    act(() => {
      result.current.onLayoutChange(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    expect(mockGetNodes).toHaveBeenCalledTimes(1);
    expect(mockGetEdges).toHaveBeenCalledTimes(1);
    expect(mockGetLaidOutElements).toHaveBeenCalledWith(mockNodes, mockEdges);
    expect(mockSetNodes).toHaveBeenCalledWith(mockLayoutResult.nodes);
    expect(mockSetEdges).toHaveBeenCalledWith(mockLayoutResult.edges);
    expect(mockFitView).toHaveBeenCalledWith({ duration: 300 });
  });

  it('should expand all nodes and edges correctly', () => {
    const { result } = renderHook(() => useLayoutControls());
    const mockEvent = ({ stopPropagation: jest.fn() } as unknown) as React.MouseEvent;

    act(() => {
      result.current.onExpandAll(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);

    // Verify that hidden properties are set to false
    const expectedNodes = mockNodes.map((node) => ({ ...node, hidden: false }));
    const expectedEdges = mockEdges.map((edge) => ({ ...edge, hidden: false }));

    expect(mockGetLaidOutElements).toHaveBeenCalledWith(expectedNodes, expectedEdges);
    expect(mockSetNodes).toHaveBeenCalledWith(mockLayoutResult.nodes);
    expect(mockSetEdges).toHaveBeenCalledWith(mockLayoutResult.edges);
    expect(mockFitView).toHaveBeenCalledWith({ duration: 300 });
  });
});

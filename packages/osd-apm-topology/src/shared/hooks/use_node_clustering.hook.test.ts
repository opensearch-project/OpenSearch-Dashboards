/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { mockUseReactFlow } from '../../test_utils/jest.setup';
import { useNodeClustering } from './use_node_clustering.hook';

const mockHasOutgoingEdges = jest.fn();
const mockGetAggregateSiblingsCount = jest.fn();
const mockHasAggregateSiblings = jest.fn();
const mockGetChildrenNodes = jest.fn();
const mockHasChildren = jest.fn();

jest.mock('./use_node_relationships.hook', () => ({
  useNodeRelationships: () => ({
    hasOutgoingEdges: mockHasOutgoingEdges,
    getAggregateSiblingsCount: mockGetAggregateSiblingsCount,
    hasAggregateSiblings: mockHasAggregateSiblings,
    getChildrenNodes: mockGetChildrenNodes,
    hasChildren: mockHasChildren,
  }),
  Visibility: { Hidden: 'hidden', Visible: 'visible', Any: 'any' },
}));

const mockGetNode = jest.fn();

describe('useNodeClustering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReactFlow.mockReturnValue({ getNode: mockGetNode, fitView: jest.fn() });
  });

  describe('isStacked', () => {
    it('returns true when node is marked stacked, top of stack, and has hidden aggregate siblings', () => {
      mockGetNode.mockReturnValue({
        id: 'n1',
        data: { isStacked: true, isTopOfTheStack: true },
      });
      mockHasAggregateSiblings.mockReturnValue(true);

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isStacked('n1')).toBe(true);
      expect(mockHasAggregateSiblings).toHaveBeenCalledWith('n1', 'hidden');
    });

    it('returns false when node is not top of stack', () => {
      mockGetNode.mockReturnValue({
        id: 'n1',
        data: { isStacked: true, isTopOfTheStack: false },
      });

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isStacked('n1')).toBe(false);
    });

    it('returns false when node does not exist', () => {
      mockGetNode.mockReturnValue(undefined);

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isStacked('missing')).toBe(false);
    });
  });

  describe('isStackable', () => {
    it('returns true when not top of stack and has visible aggregate siblings', () => {
      mockGetNode.mockReturnValue({
        id: 'n1',
        data: { isTopOfTheStack: false },
      });
      mockHasAggregateSiblings.mockReturnValue(true);

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isStackable('n1')).toBe(true);
      expect(mockHasAggregateSiblings).toHaveBeenCalledWith('n1', 'visible');
    });

    it('returns false when node is top of stack', () => {
      mockGetNode.mockReturnValue({
        id: 'n1',
        data: { isTopOfTheStack: true },
      });

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isStackable('n1')).toBe(false);
    });
  });

  describe('isCollapsed', () => {
    it('returns true when no visible outgoing edges but has hidden outgoing edges', () => {
      mockHasOutgoingEdges.mockImplementation((_id: string, visibility: string) => {
        if (visibility === 'visible') return false;
        if (visibility === 'hidden') return true;
        return false;
      });

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isCollapsed('n1')).toBe(true);
    });

    it('returns false when has visible outgoing edges', () => {
      mockHasOutgoingEdges.mockImplementation((_id: string, visibility: string) => {
        if (visibility === 'visible') return true;
        return false;
      });

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isCollapsed('n1')).toBe(false);
    });
  });

  describe('isExpanded', () => {
    it('returns true when has visible outgoing edges and no hidden children', () => {
      mockHasOutgoingEdges.mockReturnValue(true);
      mockHasChildren.mockReturnValue(false);

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isExpanded('n1')).toBe(true);
    });

    it('returns true when has visible outgoing edges and all hidden children are stacked', () => {
      mockHasOutgoingEdges.mockReturnValue(true);
      mockHasChildren.mockReturnValue(true);
      mockGetChildrenNodes.mockReturnValue([
        { id: 'c1', data: { isStacked: true } },
        { id: 'c2', data: { isStacked: true } },
      ]);

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isExpanded('n1')).toBe(true);
    });

    it('returns false when no visible outgoing edges', () => {
      mockHasOutgoingEdges.mockReturnValue(false);

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isExpanded('n1')).toBe(false);
    });
  });

  describe('isExpandable', () => {
    it('returns true when has hidden outgoing edges', () => {
      mockHasOutgoingEdges.mockReturnValue(true);

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isExpandable('n1')).toBe(true);
      expect(mockHasOutgoingEdges).toHaveBeenCalledWith('n1', 'hidden');
    });
  });

  describe('isCollapsable', () => {
    it('returns true when has visible outgoing edges', () => {
      mockHasOutgoingEdges.mockReturnValue(true);

      const { result } = renderHook(() => useNodeClustering());
      expect(result.current.isCollapsable('n1')).toBe(true);
      expect(mockHasOutgoingEdges).toHaveBeenCalledWith('n1', 'visible');
    });
  });
});

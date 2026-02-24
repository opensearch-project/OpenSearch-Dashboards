/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { it } from '../../test-utils/vitest.utilities';
import { useContextMenu } from './use-context-menu.hook';

describe('useContextMenu', () => {
  const mockSetActiveMenuNodeId = jest.fn();
  const nodeRef = {
    current: {
      getBoundingClientRect: () => ({ top: 100, left: 200, right: 500, bottom: 300 }),
    },
  } as any;

  beforeEach(() => {
    mockSetActiveMenuNodeId.mockClear();
  });

  it('returns isMenuOpen true when activeMenuNodeId matches id', () => {
    const { result } = renderHook(() =>
      useContextMenu({
        id: 'node-1',
        nodeRef,
        activeMenuNodeId: 'node-1',
        setActiveMenuNodeId: mockSetActiveMenuNodeId,
      })
    );

    expect(result.current.isMenuOpen).toBe(true);
  });

  it('returns isMenuOpen false when activeMenuNodeId does not match id', () => {
    const { result } = renderHook(() =>
      useContextMenu({
        id: 'node-1',
        nodeRef,
        activeMenuNodeId: 'node-2',
        setActiveMenuNodeId: mockSetActiveMenuNodeId,
      })
    );

    expect(result.current.isMenuOpen).toBe(false);
  });

  it('returns isMenuOpen false when activeMenuNodeId is null', () => {
    const { result } = renderHook(() =>
      useContextMenu({
        id: 'node-1',
        nodeRef,
        activeMenuNodeId: null,
        setActiveMenuNodeId: mockSetActiveMenuNodeId,
      })
    );

    expect(result.current.isMenuOpen).toBe(false);
  });

  it('onToggleMenu opens menu by calling setActiveMenuNodeId with id', () => {
    const { result } = renderHook(() =>
      useContextMenu({
        id: 'node-1',
        nodeRef,
        activeMenuNodeId: null,
        setActiveMenuNodeId: mockSetActiveMenuNodeId,
      })
    );

    const mockEvent = { stopPropagation: jest.fn() } as any;

    act(() => {
      result.current.onToggleMenu(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockSetActiveMenuNodeId).toHaveBeenCalledWith('node-1');
  });

  it('onToggleMenu closes menu when already open by calling setActiveMenuNodeId with null', () => {
    const { result } = renderHook(() =>
      useContextMenu({
        id: 'node-1',
        nodeRef,
        activeMenuNodeId: 'node-1',
        setActiveMenuNodeId: mockSetActiveMenuNodeId,
      })
    );

    const mockEvent = { stopPropagation: jest.fn() } as any;

    act(() => {
      result.current.onToggleMenu(mockEvent);
    });

    expect(mockSetActiveMenuNodeId).toHaveBeenCalledWith(null);
  });

  it('onClose sets activeMenuNodeId to null', () => {
    const { result } = renderHook(() =>
      useContextMenu({
        id: 'node-1',
        nodeRef,
        activeMenuNodeId: 'node-1',
        setActiveMenuNodeId: mockSetActiveMenuNodeId,
      })
    );

    act(() => {
      result.current.onClose();
    });

    expect(mockSetActiveMenuNodeId).toHaveBeenCalledWith(null);
  });

  it('calculates menuPosition when menu is open', () => {
    const { result } = renderHook(() =>
      useContextMenu({
        id: 'node-1',
        nodeRef,
        activeMenuNodeId: 'node-1',
        setActiveMenuNodeId: mockSetActiveMenuNodeId,
      })
    );

    expect(result.current.menuPosition).toEqual({ top: 100, left: 504 });
  });
});

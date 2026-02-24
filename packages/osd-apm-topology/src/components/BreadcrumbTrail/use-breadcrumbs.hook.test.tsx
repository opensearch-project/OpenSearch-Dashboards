/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { renderHook, act } from '../../test-utils/vitest.utilities';
import { useBreadcrumbs } from './use-breadcrumbs.hook';

describe('useBreadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with root breadcrumb', () => {
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current.breadcrumbs).toHaveLength(1);
    expect(result.current.breadcrumbs[0]).toEqual({
      title: 'World',
    });
  });

  it('should add new breadcrumb correctly', () => {
    const { result } = renderHook(() => useBreadcrumbs());
    const mockNode = { id: '1', title: 'Test Node', keyAttributes: { foo: 'bar' } };

    act(() => {
      result.current.addBreadcrumb('Test Breadcrumb', mockNode);
    });

    expect(result.current.breadcrumbs).toHaveLength(2);
    expect(result.current.breadcrumbs[1]).toEqual({
      title: 'Test Breadcrumb',
      node: mockNode,
    });
  });

  it('should navigate to specific breadcrumb and truncate subsequent items', () => {
    const { result } = renderHook(() => useBreadcrumbs());

    // Add multiple breadcrumbs
    act(() => {
      result.current.addBreadcrumb('Level 1');
      result.current.addBreadcrumb('Level 2');
      result.current.addBreadcrumb('Level 3');
    });

    expect(result.current.breadcrumbs).toHaveLength(4); // Including root

    // Navigate to second breadcrumb
    act(() => {
      result.current.navigateToBreadcrumb(1);
    });

    expect(result.current.breadcrumbs).toHaveLength(2);
    expect(result.current.breadcrumbs[1].title).toBe('Level 1');
  });

  it('should handle navigation to root breadcrumb', () => {
    const { result } = renderHook(() => useBreadcrumbs());

    // Add some breadcrumbs
    act(() => {
      result.current.addBreadcrumb('Level 1');
      result.current.addBreadcrumb('Level 2');
    });

    // Navigate to root
    act(() => {
      result.current.navigateToBreadcrumb(0);
    });

    expect(result.current.breadcrumbs).toHaveLength(1);
    expect(result.current.breadcrumbs[0].title).toBe('World');
  });
});

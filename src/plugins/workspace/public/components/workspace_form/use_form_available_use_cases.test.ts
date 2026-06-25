/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { renderHook } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceUseCase } from '../../types';
import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';

import { useFormAvailableUseCases } from './use_form_available_use_cases';

describe('useFormAvailableUseCases', () => {
  const mockUseCases: WorkspaceUseCase[] = [
    {
      id: 'useCase1',
      title: 'Use Case 1',
      description: 'Use Case 1 description',
      systematic: false,
      features: [],
    },
    {
      id: 'useCase2',
      title: 'Use Case 2',
      description: 'Use Case 2 description',
      features: [],
      systematic: true,
    },
    {
      ...DEFAULT_NAV_GROUPS.essentials,
      features: [],
    },
    {
      ...DEFAULT_NAV_GROUPS.all,
      features: [],
    },
  ];

  it('should return non-systematic use cases and ALL use case', () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);

    const { result } = renderHook(() =>
      useFormAvailableUseCases({
        registeredUseCases$,
      })
    );

    expect(result.current.availableUseCases).toEqual([
      expect.objectContaining({
        id: 'useCase1',
        title: 'Use Case 1',
        systematic: false,
      }),
      expect.objectContaining(DEFAULT_NAV_GROUPS.essentials),
      expect.objectContaining(DEFAULT_NAV_GROUPS.all),
    ]);
  });

  it('should return undefined when registeredUseCases is undefined', () => {
    const registeredUseCases$ = new BehaviorSubject(undefined as any);

    const { result } = renderHook(() =>
      useFormAvailableUseCases({
        registeredUseCases$,
      })
    );

    expect(result.current.availableUseCases).toBeUndefined();
  });
});

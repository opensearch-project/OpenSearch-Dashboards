/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { renderHook } from '@testing-library/react-hooks';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceUseCase } from '../../types';
import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { savedObjectsServiceMock } from '../../../../../core/public/mocks';
import { getIsOnlyAllowEssentialUseCase } from '../../utils';

import { useFormAvailableUseCases } from './use_form_available_use_cases';

jest.mock('../../utils', () => ({
  getIsOnlyAllowEssentialUseCase: jest.fn(),
}));

describe('useFormAvailableUseCases', () => {
  const mockSavedObjectsClient = savedObjectsServiceMock.createStartContract();

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return available use cases when onlyAllowEssentialEnabled is false', () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    const { result } = renderHook(() =>
      useFormAvailableUseCases({
        onlyAllowEssentialEnabled: false,
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

  it('should return only essential use case when onlyAllowEssentialEnabled is true', async () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    (getIsOnlyAllowEssentialUseCase as jest.Mock).mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFormAvailableUseCases({
        onlyAllowEssentialEnabled: true,
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
      })
    );

    await waitForNextUpdate();

    expect(result.current.isOnlyAllowEssential).toBe(true);
    expect(result.current.availableUseCases).toEqual([
      expect.objectContaining({
        ...DEFAULT_NAV_GROUPS.essentials,
        disabled: true,
      }),
    ]);
  });

  it('should handle error when fetching isOnlyAllowEssential', async () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    (getIsOnlyAllowEssentialUseCase as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useFormAvailableUseCases({
        onlyAllowEssentialEnabled: true,
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
      })
    );

    await waitForNextUpdate();

    expect(result.current.isOnlyAllowEssential).toBe(false);
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

  it('should not update isOnlyAllowEssential after unmount', async () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    const getIsOnlyAllowEssentialUseCaseMock = (getIsOnlyAllowEssentialUseCase as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(false), 0);
        })
    );
    const { unmount, result } = renderHook(() =>
      useFormAvailableUseCases({
        onlyAllowEssentialEnabled: true,
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
      })
    );

    expect(result.current.isOnlyAllowEssential).toBeUndefined();
    unmount();
    await getIsOnlyAllowEssentialUseCaseMock.mock.results[0].value;
    expect(result.current.isOnlyAllowEssential).toBeUndefined();
  });
});

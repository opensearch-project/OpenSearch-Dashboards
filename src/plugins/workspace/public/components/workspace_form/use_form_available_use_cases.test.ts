/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { renderHook } from '@testing-library/react-hooks';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceUseCase } from '../../types';
import { DEFAULT_NAV_GROUPS, UseCaseId } from '../../../../../core/public';
import { savedObjectsServiceMock } from '../../../../../core/public/mocks';
import { areAllDataSourcesOpenSearchServerless } from '../../utils';
import { UseCaseService } from '../../services';

import { useFormAvailableUseCases } from './use_form_available_use_cases';

jest.mock('../../utils', () => ({
  areAllDataSourcesOpenSearchServerless: jest.fn(),
}));

describe('useFormAvailableUseCases', () => {
  const mockSavedObjectsClient = savedObjectsServiceMock.createStartContract();

  const mockUseCaseService = {
    supportedUseCasesForServerless: [UseCaseId.ESSENTIAL_USE_CASE_ID],
  } as UseCaseService;

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

  it('should return available use cases when data sources are not serverless', () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    (areAllDataSourcesOpenSearchServerless as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() =>
      useFormAvailableUseCases({
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
        useCaseService: mockUseCaseService,
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

  it('should return only supported serverless use cases when all data sources are serverless', async () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    (areAllDataSourcesOpenSearchServerless as jest.Mock).mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFormAvailableUseCases({
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
        useCaseService: mockUseCaseService,
      })
    );

    await waitForNextUpdate();

    expect(result.current.availableUseCases).toEqual([
      expect.objectContaining({
        ...DEFAULT_NAV_GROUPS.essentials,
        disabled: true,
      }),
    ]);
  });

  it('should handle error when fetching serverless status and default to non-serverless behavior', async () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    (areAllDataSourcesOpenSearchServerless as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useFormAvailableUseCases({
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
        useCaseService: mockUseCaseService,
      })
    );

    await waitForNextUpdate();

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

  it('should not update serverless status after unmount', async () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    const areAllDataSourcesServerlessMock = (areAllDataSourcesOpenSearchServerless as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(true), 0);
        })
    );
    const { unmount, result } = renderHook(() =>
      useFormAvailableUseCases({
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
        useCaseService: mockUseCaseService,
      })
    );

    // Initially should show non-serverless behavior (all use cases)
    expect(result.current.availableUseCases).toEqual([
      expect.objectContaining({
        id: 'useCase1',
        title: 'Use Case 1',
        systematic: false,
      }),
      expect.objectContaining(DEFAULT_NAV_GROUPS.essentials),
      expect.objectContaining(DEFAULT_NAV_GROUPS.all),
    ]);

    unmount();
    await areAllDataSourcesServerlessMock.mock.results[0].value;

    // After unmount, the result should remain unchanged
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
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
        useCaseService: mockUseCaseService,
      })
    );

    expect(result.current.availableUseCases).toBeUndefined();
  });

  it('should work without savedObjects parameter', () => {
    const registeredUseCases$ = new BehaviorSubject(mockUseCases);

    const { result } = renderHook(() =>
      useFormAvailableUseCases({
        registeredUseCases$,
        useCaseService: mockUseCaseService,
      })
    );

    // Should default to non-serverless behavior when no savedObjects provided
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

  it('should handle multiple supported serverless use cases', async () => {
    const multiServerlessUseCaseService = {
      supportedUseCasesForServerless: [UseCaseId.ESSENTIAL_USE_CASE_ID, 'useCase1' as UseCaseId],
    } as UseCaseService;

    const registeredUseCases$ = new BehaviorSubject(mockUseCases);
    (areAllDataSourcesOpenSearchServerless as jest.Mock).mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFormAvailableUseCases({
        savedObjects: mockSavedObjectsClient,
        registeredUseCases$,
        useCaseService: multiServerlessUseCaseService,
      })
    );

    await waitForNextUpdate();

    expect(result.current.availableUseCases).toEqual([
      expect.objectContaining({
        id: 'useCase1',
        title: 'Use Case 1',
        disabled: false, // Should not be disabled when multiple use cases are supported
      }),
      expect.objectContaining({
        ...DEFAULT_NAV_GROUPS.essentials,
        disabled: false, // Should not be disabled when multiple use cases are supported
      }),
    ]);
  });
});

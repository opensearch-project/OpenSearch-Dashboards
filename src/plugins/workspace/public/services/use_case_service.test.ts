/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { chromeServiceMock } from '../../../../core/public/mocks';
import { NavGroupType } from '../../../../core/public';
import { UseCaseService } from './use_case_service';

const mockNavGroupsMap = {
  system: {
    id: 'system',
    title: 'System',
    navLinks: [],
    type: NavGroupType.SYSTEM,
  },
  search: {
    id: 'search',
    title: 'Search',
    navLinks: [{ id: 'searchRelevance' }],
    order: 2000,
  },
  observability: {
    id: 'observability',
    title: 'Observability',
    description: 'Observability description',
    navLinks: [{ id: 'dashboards' }],
    order: 1000,
  },
};
const setupUseCaseStart = (options?: { navGroupEnabled?: boolean }) => {
  const chrome = chromeServiceMock.createStartContract();
  const workspaceConfigurableApps$ = new BehaviorSubject([{ id: 'searchRelevance' }]);
  const navGroupsMap$ = new BehaviorSubject(mockNavGroupsMap);
  const useCase = new UseCaseService();

  chrome.navGroup.getNavGroupEnabled.mockImplementation(() => options?.navGroupEnabled ?? true);
  chrome.navGroup.getNavGroupsMap$.mockImplementation(() => navGroupsMap$);

  return {
    chrome,
    navGroupsMap$,
    workspaceConfigurableApps$,
    useCaseStart: useCase.start({
      chrome,
      workspaceConfigurableApps$,
      ...options,
    }),
  };
};

describe('UseCaseService', () => {
  describe('#start', () => {
    it('should return built in use cases when nav group disabled', async () => {
      const { useCaseStart } = setupUseCaseStart({
        navGroupEnabled: false,
      });
      const useCases = await useCaseStart.getRegisteredUseCases$().pipe(first()).toPromise();

      expect(useCases).toHaveLength(1);
      expect(useCases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'search',
            title: 'Search',
            features: expect.arrayContaining(['searchRelevance']),
          }),
        ])
      );
    });

    it('should return registered use cases when nav group disabled', async () => {
      const { useCaseStart } = setupUseCaseStart();
      const useCases = await useCaseStart.getRegisteredUseCases$().pipe(first()).toPromise();

      expect(useCases).toEqual([
        expect.objectContaining({
          id: 'observability',
          title: 'Observability',
          features: expect.arrayContaining(['dashboards']),
        }),
        expect.objectContaining({
          id: 'search',
          title: 'Search',
          features: expect.arrayContaining(['searchRelevance']),
        }),
        expect.objectContaining({
          id: 'system',
          title: 'System',
          features: [],
          systematic: true,
        }),
      ]);
    });

    it('should not emit after navGroupsMap$ emit same value', async () => {
      const { useCaseStart, navGroupsMap$ } = setupUseCaseStart();
      const registeredUseCase$ = useCaseStart.getRegisteredUseCases$();
      const fn = jest.fn();

      registeredUseCase$.subscribe(fn);

      expect(fn).toHaveBeenCalledTimes(1);

      navGroupsMap$.next({ ...mockNavGroupsMap });
      expect(fn).toHaveBeenCalledTimes(1);

      navGroupsMap$.next({
        ...mockNavGroupsMap,
        observability: {
          ...mockNavGroupsMap.observability,
          navLinks: [{ id: 'bar' }],
        },
      });
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

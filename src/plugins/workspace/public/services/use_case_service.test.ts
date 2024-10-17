/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { chromeServiceMock, coreMock } from '../../../../core/public/mocks';
import {
  ALL_USE_CASE_ID,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  NavGroupItemInMap,
  NavGroupType,
} from '../../../../core/public';
import { UseCaseService } from './use_case_service';
import { waitFor } from '@testing-library/dom';
import { WORKSPACE_DETAIL_APP_ID } from '../../common/constants';

const mockNavGroupsMap = {
  system: {
    id: 'system',
    title: 'System',
    description: 'System use case',
    navLinks: [],
    type: NavGroupType.SYSTEM,
  },
  search: {
    id: 'search',
    title: 'Search',
    description: 'Search use case',
    navLinks: [{ id: 'searchRelevance', title: 'Search Relevance' }],
    order: 2000,
  },
  observability: {
    id: 'observability',
    title: 'Observability',
    description: 'Observability description',
    navLinks: [{ id: 'dashboards', title: 'Dashboards' }],
    order: 1000,
  },
};
const setupUseCaseStart = (options?: { navGroupEnabled?: boolean }) => {
  const chrome = chromeServiceMock.createStartContract();
  const workspaceConfigurableApps$ = new BehaviorSubject([
    { id: 'searchRelevance', title: 'Search Relevance' },
  ]);
  const navGroupsMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>(mockNavGroupsMap);
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
  describe('#setup', () => {
    it('should add manage workspace category to current use case and register collaborators when permission is enabled', async () => {
      const useCaseService = new UseCaseService();
      const coreSetup = coreMock.createSetup();
      const navGroupMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>({});
      const coreStartMock = coreMock.createStart();
      coreStartMock.application.capabilities = {
        ...coreStartMock.application.capabilities,
        workspaces: {
          ...coreStartMock.application.capabilities.workspaces,
          permissionEnabled: true,
        },
      };
      coreSetup.getStartServices.mockResolvedValue([coreStartMock, {}, {}]);
      coreStartMock.chrome.navGroup.getNavGroupsMap$.mockReturnValue(navGroupMap$);
      useCaseService.setup(coreSetup);
      const navGroupInfo = {
        ...DEFAULT_NAV_GROUPS.all,
        navLinks: [],
      };
      navGroupMap$.next({
        [ALL_USE_CASE_ID]: navGroupInfo,
      });
      coreSetup.workspaces.currentWorkspace$.next({
        id: ALL_USE_CASE_ID,
        name: ALL_USE_CASE_ID,
        features: [`use-case-${ALL_USE_CASE_ID}`],
      });
      await waitFor(() => {
        expect(coreSetup.chrome.navGroup.addNavLinksToGroup).toBeCalledWith(navGroupInfo, [
          {
            id: WORKSPACE_DETAIL_APP_ID,
            category: DEFAULT_APP_CATEGORIES.manageWorkspace,
            order: 100,
            title: 'Workspace details',
          },
          {
            id: 'workspace_collaborators',
            category: DEFAULT_APP_CATEGORIES.manageWorkspace,
            order: 200,
            title: 'Collaborators',
          },
          {
            id: 'dataSources',
            category: DEFAULT_APP_CATEGORIES.manageWorkspace,
            order: 300,
          },
          {
            id: 'indexPatterns',
            category: DEFAULT_APP_CATEGORIES.manageWorkspace,
            order: 400,
          },
          {
            id: 'objects',
            category: DEFAULT_APP_CATEGORIES.manageWorkspace,
            order: 500,
          },
          {
            id: 'import_sample_data',
            category: DEFAULT_APP_CATEGORIES.manageWorkspace,
            order: 600,
            title: 'Sample data',
          },
        ]);
      });
    });
  });
  describe('#start', () => {
    it('should return built in use cases when nav group disabled', async () => {
      const { useCaseStart } = setupUseCaseStart({
        navGroupEnabled: false,
      });
      const useCases = await useCaseStart.getRegisteredUseCases$().pipe(first()).toPromise();

      expect(useCases).toHaveLength(2);
      expect(useCases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'search',
            title: 'Search',
            features: expect.arrayContaining([
              { id: 'searchRelevance', title: 'Search Relevance' },
            ]),
          }),
          expect.objectContaining({
            ...DEFAULT_NAV_GROUPS.all,
          }),
        ])
      );
    });

    it('should return registered use cases when nav group enabled', async () => {
      const { useCaseStart } = setupUseCaseStart();
      const useCases = await useCaseStart.getRegisteredUseCases$().pipe(first()).toPromise();

      expect(useCases).toEqual([
        expect.objectContaining({
          id: 'observability',
          title: 'Observability',
          features: expect.arrayContaining([{ id: 'dashboards', title: 'Dashboards' }]),
        }),
        expect.objectContaining({
          id: 'search',
          title: 'Search',
          features: expect.arrayContaining([{ id: 'searchRelevance', title: 'Search Relevance' }]),
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
      const registeredUseCases$ = useCaseStart.getRegisteredUseCases$();
      const fn = jest.fn();

      registeredUseCases$.subscribe(fn);

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

    it('should move all use case to the last one', async () => {
      const { useCaseStart, navGroupsMap$ } = setupUseCaseStart();

      navGroupsMap$.next({
        ...mockNavGroupsMap,
        [ALL_USE_CASE_ID]: { ...DEFAULT_NAV_GROUPS.all, navLinks: [], order: -1 },
      });
      let useCases = await useCaseStart.getRegisteredUseCases$().pipe(first()).toPromise();

      expect(useCases[useCases.length - 1]).toEqual(
        expect.objectContaining({
          id: ALL_USE_CASE_ID,
          systematic: true,
        })
      );

      navGroupsMap$.next({
        [ALL_USE_CASE_ID]: { ...DEFAULT_NAV_GROUPS.all, navLinks: [], order: 1500 },
        ...mockNavGroupsMap,
      });
      useCases = await useCaseStart.getRegisteredUseCases$().pipe(first()).toPromise();

      expect(useCases[useCases.length - 1]).toEqual(
        expect.objectContaining({
          id: ALL_USE_CASE_ID,
          systematic: true,
        })
      );
    });
  });
});

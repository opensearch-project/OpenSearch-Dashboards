/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import {
  ChromeStart,
  CoreSetup,
  DEFAULT_APP_CATEGORIES,
  PublicAppInfo,
  WorkspacesSetup,
  DEFAULT_NAV_GROUPS,
  ALL_USE_CASE_ID,
} from '../../../../core/public';
import { WORKSPACE_USE_CASES } from '../../common/constants';
import {
  convertNavGroupToWorkspaceUseCase,
  getFirstUseCaseOfFeatureConfigs,
  isEqualWorkspaceUseCase,
} from '../utils';
import { WorkspaceUseCase } from '../types';

export interface UseCaseServiceSetupDeps {
  chrome: CoreSetup['chrome'];
  workspaces: WorkspacesSetup;
  getStartServices: CoreSetup['getStartServices'];
}

export class UseCaseService {
  private workspaceAndManageWorkspaceCategorySubscription?: Subscription;
  constructor() {}

  /**
   * Add nav links belong to `manage workspace` to all of the use cases.
   * @param coreSetup
   * @param currentWorkspace
   */
  private async registerManageWorkspaceCategory(setupDeps: UseCaseServiceSetupDeps) {
    const [coreStart] = await setupDeps.getStartServices();
    this.workspaceAndManageWorkspaceCategorySubscription?.unsubscribe();
    this.workspaceAndManageWorkspaceCategorySubscription = combineLatest([
      setupDeps.workspaces.currentWorkspace$,
      coreStart.chrome.navGroup.getNavGroupsMap$(),
    ])
      .pipe(
        map(([currentWorkspace, navGroupMap]) => {
          const currentUseCase = getFirstUseCaseOfFeatureConfigs(currentWorkspace?.features || []);
          if (!currentUseCase) {
            return undefined;
          }

          return navGroupMap[currentUseCase];
        })
      )
      .pipe(
        distinctUntilChanged((navGroupInfo, anotherNavGroup) => {
          return navGroupInfo?.id === anotherNavGroup?.id;
        })
      )
      .subscribe((navGroupInfo) => {
        if (navGroupInfo) {
          setupDeps.chrome.navGroup.addNavLinksToGroup(navGroupInfo, [
            {
              id: 'dataSources_core',
              category: DEFAULT_APP_CATEGORIES.manageWorkspace,
              order: 100,
            },
            {
              id: 'indexPatterns',
              category: DEFAULT_APP_CATEGORIES.manageWorkspace,
              order: 200,
            },
            {
              id: 'objects',
              category: DEFAULT_APP_CATEGORIES.manageWorkspace,
              order: 300,
            },
          ]);
        }
      });
  }

  setup({ chrome, workspaces, getStartServices }: UseCaseServiceSetupDeps) {
    this.registerManageWorkspaceCategory({
      chrome,
      workspaces,
      getStartServices,
    });
  }

  start({
    chrome,
    workspaceConfigurableApps$,
  }: {
    chrome: ChromeStart;
    workspaceConfigurableApps$: Observable<PublicAppInfo[]>;
  }) {
    return {
      getRegisteredUseCases$: () => {
        if (chrome.navGroup.getNavGroupEnabled()) {
          return chrome.navGroup
            .getNavGroupsMap$()
            .pipe(
              map((navGroupsMap) =>
                Object.values(navGroupsMap).map(convertNavGroupToWorkspaceUseCase)
              )
            )
            .pipe(
              distinctUntilChanged((useCases, anotherUseCases) => {
                return (
                  useCases.length === anotherUseCases.length &&
                  useCases.every(
                    (useCase) =>
                      !!anotherUseCases.find((anotherUseCase) =>
                        isEqualWorkspaceUseCase(useCase, anotherUseCase)
                      )
                  )
                );
              })
            )
            .pipe(
              map((useCases) =>
                useCases.sort((a, b) => {
                  // Make sure all use case should be the latest
                  if (a.id === ALL_USE_CASE_ID) {
                    return 1;
                  }
                  if (b.id === ALL_USE_CASE_ID) {
                    return -1;
                  }
                  return (
                    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
                  );
                })
              )
            );
        }

        return workspaceConfigurableApps$.pipe(
          map((configurableApps) => {
            const configurableAppsId = configurableApps.map((app) => app.id);

            return [
              WORKSPACE_USE_CASES.observability,
              WORKSPACE_USE_CASES['security-analytics'],
              WORKSPACE_USE_CASES.essentials,
              WORKSPACE_USE_CASES.search,
            ]
              .filter((useCase) => {
                return useCase.features.some((featureId) => configurableAppsId.includes(featureId));
              })
              .map((item) => ({
                ...item,
                features: item.features.map((featureId) => ({
                  title: configurableApps.find((app) => app.id === featureId)?.title,
                  id: featureId,
                })),
              }))
              .concat({
                ...DEFAULT_NAV_GROUPS.all,
                features: configurableApps.map((app) => ({ id: app.id, title: app.title })),
              }) as WorkspaceUseCase[];
          })
        );
      },
    };
  }

  stop() {
    this.workspaceAndManageWorkspaceCategorySubscription?.unsubscribe();
  }
}

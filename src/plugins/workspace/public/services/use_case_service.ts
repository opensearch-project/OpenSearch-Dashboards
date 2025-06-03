/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { i18n } from '@osd/i18n';

import {
  ChromeStart,
  CoreSetup,
  DEFAULT_APP_CATEGORIES,
  PublicAppInfo,
  WorkspacesSetup,
  DEFAULT_NAV_GROUPS,
  ALL_USE_CASE_ID,
} from '../../../../core/public';
import {
  WORKSPACE_DETAIL_APP_ID,
  WORKSPACE_USE_CASES,
  WORKSPACE_COLLABORATORS_APP_ID,
} from '../../common/constants';
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
    const isPermissionEnabled = coreStart?.application?.capabilities.workspaces.permissionEnabled;

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
              id: WORKSPACE_DETAIL_APP_ID,
              category: DEFAULT_APP_CATEGORIES.manageWorkspace,
              order: 100,
              title: i18n.translate('workspace.settings.workspaceDetails', {
                defaultMessage: 'Workspace details',
              }),
            },
            ...(isPermissionEnabled
              ? [
                  {
                    id: WORKSPACE_COLLABORATORS_APP_ID,
                    category: DEFAULT_APP_CATEGORIES.manageWorkspace,
                    order: 200,
                    title: i18n.translate('workspace.settings.workspaceCollaborators', {
                      defaultMessage: 'Collaborators',
                    }),
                  },
                ]
              : []),
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
              title: i18n.translate('workspace.left.sampleData.label', {
                defaultMessage: 'Sample data',
              }),
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
              map((navGroupsMap) => {
                return Object.values(navGroupsMap).map(convertNavGroupToWorkspaceUseCase);
              })
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
              .map(
                (item) =>
                  ({
                    ...item,
                    features: item.features.map((featureId) => ({
                      title: configurableApps.find((app) => app.id === featureId)?.title,
                      id: featureId,
                    })),
                  } as WorkspaceUseCase)
              )
              .concat({
                ...DEFAULT_NAV_GROUPS.all,
                features: configurableApps.map((app) => ({
                  id: app.id,
                  title: app.title,
                })),
              } as WorkspaceUseCase);
          })
        );
      },
    };
  }

  stop() {
    this.workspaceAndManageWorkspaceCategorySubscription?.unsubscribe();
  }
}

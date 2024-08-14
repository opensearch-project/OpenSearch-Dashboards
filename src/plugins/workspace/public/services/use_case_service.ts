/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import {
  ALL_USE_CASE_ID,
  ChromeStart,
  DEFAULT_NAV_GROUPS,
  PublicAppInfo,
} from '../../../../core/public';
import { WORKSPACE_USE_CASES } from '../../common/constants';
import { WorkspaceUseCase } from '../types';
import { convertNavGroupToWorkspaceUseCase, isEqualWorkspaceUseCase } from '../utils';

export class UseCaseService {
  constructor() {}

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
}

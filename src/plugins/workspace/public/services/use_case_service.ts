/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { ChromeStart, PublicAppInfo } from '../../../../core/public';
import { WORKSPACE_USE_CASES } from '../../common/constants';
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
                useCases.sort(
                  (a, b) =>
                    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
                )
              )
            );
        }

        return workspaceConfigurableApps$.pipe(
          map((configurableApps) => {
            const configurableAppsId = configurableApps.map((app) => app.id);

            return [
              WORKSPACE_USE_CASES.observability,
              WORKSPACE_USE_CASES['security-analytics'],
              WORKSPACE_USE_CASES.analytics,
              WORKSPACE_USE_CASES.search,
            ].filter((useCase) => {
              return useCase.features.some((featureId) => configurableAppsId.includes(featureId));
            });
          })
        );
      },
    };
  }
}

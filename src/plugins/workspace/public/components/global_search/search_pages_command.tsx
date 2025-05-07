/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { first } from 'rxjs/operators';
import React, { ReactNode } from 'react';
import { BehaviorSubject } from 'rxjs';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { DEFAULT_NAV_GROUPS, NavGroupType } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { searchNavigationLinks } from '../../../../../core/public';
import { NavLink, WorkspaceGlobalSearchPageItem } from './workspace_global_search_item';

export const workspaceSearchPages = async (
  query: string,
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>,
  coreStart?: CoreStart,
  callback?: () => void
): Promise<ReactNode[]> => {
  if (coreStart) {
    const currentWorkspace = await coreStart.workspaces.currentWorkspace$.pipe(first()).toPromise();

    const navGroupMap = await coreStart.chrome.navGroup
      .getNavGroupsMap$()
      .pipe(first())
      .toPromise();

    const allAvailableCaseId = Object.entries(DEFAULT_NAV_GROUPS)
      .filter(([key, value]) => {
        return value.type === NavGroupType.SYSTEM;
      })
      .map(([key, value]) => key);

    allAvailableCaseId.push(
      getFirstUseCaseOfFeatureConfigs(currentWorkspace?.features || []) || ''
    );

    const searchResult = searchNavigationLinks(allAvailableCaseId, navGroupMap, query);

    const handleCallback = (link: NavLink) => {
      callback?.();
      const isPageOutOfWorkspace = link.navGroup.type === NavGroupType.SYSTEM;
      if (isPageOutOfWorkspace && currentWorkspace) {
        // remove workspace information in the URL, special handling for data source which could visible both in/out workspace
        const urlWithoutWorkspace = formatUrlWithWorkspaceId(
          link.href,
          '',
          coreStart.http.basePath
        );
        window.location.assign(urlWithoutWorkspace);
        return;
      }
      coreStart.application.navigateToApp(link.id);
    };

    const pages = searchResult.slice(0, 10).map((link) => {
      return (
        <WorkspaceGlobalSearchPageItem
          link={link}
          search={query}
          onCallback={handleCallback}
          currentWorkspace={currentWorkspace}
          registeredUseCases$={registeredUseCases$}
        />
      );
    });

    return pages;
  }
  return [];
};

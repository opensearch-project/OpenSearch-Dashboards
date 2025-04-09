/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChromeNavLink,
  ChromeRegistrationNavLink,
  CoreStart,
  NavGroupItemInMap,
} from 'opensearch-dashboards/public';
import { first } from 'rxjs/operators';
import React, { ReactNode } from 'react';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import { EuiBreadcrumb } from '@elastic/eui';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { DEFAULT_NAV_GROUPS, NavGroupType } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceTitleDisplay } from '../workspace_name/workspace_name';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import {
  searchNavigationLinks,
  navGroupElement,
  GlobalSearchPageItem,
} from '../../../../../core/public';

type Link = { navGroup: NavGroupItemInMap } & ChromeRegistrationNavLink & ChromeNavLink;

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

    const handleCallback = (link: Link) => {
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

    const handleBreadcrumbs = (
      link: Link,
      breadcrumbs: EuiBreadcrumb[],
      availableUseCases: WorkspaceUseCase[]
    ) => {
      const isPageOutOfWorkspace = link.navGroup.type === NavGroupType.SYSTEM;

      if (currentWorkspace && !isPageOutOfWorkspace) {
        breadcrumbs.push({
          text: (
            <WorkspaceTitleDisplay
              workspace={currentWorkspace}
              availableUseCases={availableUseCases || []}
            />
          ),
        });
      } else {
        breadcrumbs.push({ text: navGroupElement(link.navGroup) });
      }
    };

    const pages = searchResult.slice(0, 10).map((link) => {
      return (
        <GlobalSearchPageItem
          link={link}
          search={query}
          application={coreStart.application}
          callback={() => {
            handleCallback(link);
          }}
          customizeBreadcrumbs={(breadcrumbs) => {
            const availableUseCases = useObservable(registeredUseCases$);
            handleBreadcrumbs(link, breadcrumbs, availableUseCases!);
          }}
        />
      );
    });

    return pages;
  }
  return [];
};

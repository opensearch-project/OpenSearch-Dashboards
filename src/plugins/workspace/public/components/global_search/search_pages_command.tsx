/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChromeNavLink, ChromeRegistrationNavLink, CoreStart } from 'opensearch-dashboards/public';
import { first } from 'rxjs/operators';
import React, { ReactNode } from 'react';
import { BehaviorSubject } from 'rxjs';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { GlobalSearchPageItem } from './page_item';
import { DEFAULT_NAV_GROUPS, NavGroupType } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';

export const searchPages = async (
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

    const searchResult = allAvailableCaseId.flatMap((useCaseId) => {
      const navGroup = navGroupMap[useCaseId];
      if (navGroup) {
        const links = navGroup.navLinks as Array<ChromeRegistrationNavLink & ChromeNavLink>;
        // parent nav links are not clickable
        const parentNavLinkIds = links.map((link) => link.parentNavLinkId).filter((link) => !!link);
        return links
          .filter((link) => {
            const title = link.title;
            let parentNavLinkTitle;
            // parent title also taken into consideration for search its sub items
            if (link.parentNavLinkId) {
              parentNavLinkTitle = navGroup.navLinks.find(
                (navLink) => navLink.id === link.parentNavLinkId
              )?.title;
            }
            const titleMatch = title && title.toLowerCase().includes(query.toLowerCase());
            const parentTitleMatch =
              parentNavLinkTitle && parentNavLinkTitle.toLowerCase().includes(query.toLowerCase());
            return (
              !link.hidden &&
              !link.disabled &&
              (titleMatch || parentTitleMatch) &&
              !parentNavLinkIds.includes(link.id)
            );
          })
          .map((link) => ({
            ...link,
            navGroup,
          }));
      }
      return [];
    });

    const pages = searchResult.slice(0, 10).map((link) => {
      return (
        <GlobalSearchPageItem
          link={link}
          search={query}
          currentWorkspace={currentWorkspace}
          application={coreStart.application}
          http={coreStart.http}
          registeredUseCases$={registeredUseCases$}
          callback={callback}
        />
      );
    });

    return pages;
  }
  return [];
};

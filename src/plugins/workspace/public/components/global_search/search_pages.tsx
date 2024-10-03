/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChromeNavLink, ChromeRegistrationNavLink, CoreStart } from 'opensearch-dashboards/public';
import { first } from 'rxjs/operators';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { GlobalSearchPageItem } from './page_item';
import { PageSection } from './pages_section';
import { DEFAULT_NAV_GROUPS, NavGroupType } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';

export const searchPageWithInWorkspace = async (
  query: string,
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>,
  coreStart?: CoreStart
): Promise<React.JSX.Element | undefined> => {
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
        return links
          .filter(
            (link) =>
              !link.hidden && link.title && link.title.toLowerCase().includes(query.toLowerCase())
          )
          .map((link) => ({
            ...link,
            navGroup,
          }));
      }
      return [];
    });

    // eslint-disable-next-line no-console
    console.log(searchResult);

    const pages = searchResult.slice(0, 10).map((link) => {
      return (
        <GlobalSearchPageItem
          link={link}
          search={query}
          currentWorkspace={currentWorkspace}
          application={coreStart.application}
          registeredUseCases$={registeredUseCases$}
        />
      );
    });

    return <PageSection items={pages} />;
  }
  return undefined;
};

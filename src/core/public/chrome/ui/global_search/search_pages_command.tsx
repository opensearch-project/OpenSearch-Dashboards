/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { GlobalSearchPageItem } from './page_item';
import { ChromeNavGroupServiceStartContract } from '../../nav_group';
import { InternalApplicationStart } from '../../../../../core/public/application';
import { searchNavigationLinks } from '../../utils';
import { GlobalSearchResult } from '../../global_search';
import {
  DEFAULT_NAV_GROUPS,
  renderNavGroupElement,
  NavGroupType,
} from '../../../../../core/public';

export const searchPages = async (
  query: string,
  navGroup?: ChromeNavGroupServiceStartContract,
  application?: InternalApplicationStart
): Promise<GlobalSearchResult[]> => {
  if (!query) {
    return [];
  }

  if (navGroup && application) {
    const navGroupMap = await navGroup.getNavGroupsMap$().pipe(first()).toPromise();

    const searchResult = searchNavigationLinks(
      [
        DEFAULT_NAV_GROUPS.all.id,
        DEFAULT_NAV_GROUPS.dataAdministration.id,
        DEFAULT_NAV_GROUPS.settingsAndSetup.id,
      ],
      navGroupMap,
      query
    );

    const pages = searchResult.slice(0, 10).map((link) => {
      const isLandingPage = link.id.toLowerCase().endsWith('landing');
      return {
        id: link.id,
        label: isLandingPage ? `${link.navGroup.title} ${link.title}` : link.title,
        content: (
          <GlobalSearchPageItem
            link={link}
            search={query}
            renderBreadcrumbs={(breadcrumbs) => {
              if (link.navGroup.type === NavGroupType.SYSTEM) {
                /**
                 * Search items from dataAdministration and settingsAndSetup are technically out of the
                 * current navigation menu, add breadcrumbs before these search items for clarification
                 */
                return [{ text: renderNavGroupElement(link.navGroup) }, ...breadcrumbs];
              }
              return breadcrumbs;
            }}
          />
        ),
        execute: () => application.navigateToApp(link.id),
      };
    });

    return pages;
  }
  return [];
};

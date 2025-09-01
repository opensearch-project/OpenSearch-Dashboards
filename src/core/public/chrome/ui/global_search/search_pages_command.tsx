/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import React, { ReactNode } from 'react';
import { GlobalSearchPageItem } from './page_item';
import { ChromeNavGroupServiceStartContract } from '../../nav_group';
import { InternalApplicationStart } from '../../../../../core/public/application';
import { searchNavigationLinks } from '../../utils';
import {
  DEFAULT_NAV_GROUPS,
  renderNavGroupElement,
  NavGroupType,
} from '../../../../../core/public';

export const searchPages = async (
  query: string,
  navGroup?: ChromeNavGroupServiceStartContract,
  application?: InternalApplicationStart,
  callback?: () => void
): Promise<ReactNode[]> => {
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
      return (
        <GlobalSearchPageItem
          link={link}
          search={query}
          callback={() => {
            callback?.();
            application.navigateToApp(link.id);
          }}
          renderBreadcrumbs={(breadcrumbs) => {
            if (link.navGroup.type === NavGroupType.SYSTEM) {
              /**
               * Search items from dataAdministration and settingsAndSetup are technically out of the
               * current navigation menu, add breadcrumbs before these search items for clarification
               */
              const updatedBreadcrumbs = [
                { text: renderNavGroupElement(link.navGroup) },
                ...breadcrumbs,
              ];
              return updatedBreadcrumbs;
            }
            return breadcrumbs;
          }}
        />
      );
    });

    return pages;
  }
  return [];
};

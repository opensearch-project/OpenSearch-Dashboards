/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import './collapsible_nav.scss';
import {
  EuiCollapsibleNav,
  EuiCollapsibleNavGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiShowFor,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { groupBy, sortBy } from 'lodash';
import React, { useRef } from 'react';
import useObservable from 'react-use/lib/useObservable';
import * as Rx from 'rxjs';
import { WorkspaceStart } from 'opensearch-dashboards/public';
import { ChromeNavLink, ChromeRecentlyAccessedHistoryItem } from '../..';
import { AppCategory } from '../../../../types';
import { InternalApplicationStart } from '../../../application';
import { HttpStart } from '../../../http';
import { OnIsLockedUpdate } from './';
import {
  createEuiListItem,
  createRecentChromeNavLink,
  emptyRecentlyVisited,
  CollapsibleNavLink,
} from './nav_link';
import { ChromeBranding } from '../../chrome_service';
import { CollapsibleNavHeader } from './collapsible_nav_header';
import { MANAGEMENT_WORKSPACE_ID } from '../../../utils';

function getAllCategories(allCategorizedLinks: Record<string, CollapsibleNavLink[]>) {
  const allCategories = {} as Record<string, AppCategory | undefined>;

  for (const [key, value] of Object.entries(allCategorizedLinks)) {
    allCategories[key] = value[0].category;
  }

  return allCategories;
}

function getOrderedCategories(
  mainCategories: Record<string, CollapsibleNavLink[]>,
  categoryDictionary: ReturnType<typeof getAllCategories>
) {
  return sortBy(
    Object.keys(mainCategories),
    (categoryName) => categoryDictionary[categoryName]?.order
  );
}

function getMergedNavLinks(
  orderedCategories: string[],
  uncategorizedLinks: CollapsibleNavLink[],
  categoryDictionary: ReturnType<typeof getAllCategories>
): Array<string | CollapsibleNavLink> {
  const uncategorizedLinksWithOrder = sortBy(
    uncategorizedLinks.filter((link) => link.order !== null),
    'order'
  );
  const uncategorizedLinksWithoutOrder = uncategorizedLinks.filter((link) => link.order === null);
  const orderedCategoryWithOrder = orderedCategories
    .filter((categoryName) => categoryDictionary[categoryName]?.order !== null)
    .map((categoryName) => ({ categoryName, order: categoryDictionary[categoryName]?.order }));
  const orderedCategoryWithoutOrder = orderedCategories.filter(
    (categoryName) => categoryDictionary[categoryName]?.order === null
  );
  const mergedNavLinks = sortBy(
    [...uncategorizedLinksWithOrder, ...orderedCategoryWithOrder],
    'order'
  ).map((navLink) => ('categoryName' in navLink ? navLink.categoryName : navLink));
  // if order is not defined , categorized links will be placed before uncategorized links
  return [...mergedNavLinks, ...orderedCategoryWithoutOrder, ...uncategorizedLinksWithoutOrder];
}

function getCategoryLocalStorageKey(id: string) {
  return `core.navGroup.${id}`;
}

function getIsCategoryOpen(id: string, storage: Storage) {
  const value = storage.getItem(getCategoryLocalStorageKey(id)) ?? 'true';

  return value === 'true';
}

function setIsCategoryOpen(id: string, isOpen: boolean, storage: Storage) {
  storage.setItem(getCategoryLocalStorageKey(id), `${isOpen}`);
}

interface Props {
  appId$: InternalApplicationStart['currentAppId$'];
  basePath: HttpStart['basePath'];
  id: string;
  isLocked: boolean;
  isNavOpen: boolean;
  homeHref: string;
  navLinks$: Rx.Observable<ChromeNavLink[]>;
  recentlyAccessed$: Rx.Observable<ChromeRecentlyAccessedHistoryItem[]>;
  storage?: Storage;
  onIsLockedUpdate: OnIsLockedUpdate;
  closeNav: () => void;
  getUrlForApp: InternalApplicationStart['getUrlForApp'];
  navigateToApp: InternalApplicationStart['navigateToApp'];
  navigateToUrl: InternalApplicationStart['navigateToUrl'];
  customNavLink$: Rx.Observable<ChromeNavLink | undefined>;
  branding: ChromeBranding;
  workspaces: WorkspaceStart;
}

export function CollapsibleNav({
  basePath,
  id,
  isLocked,
  isNavOpen,
  homeHref,
  storage = window.localStorage,
  onIsLockedUpdate,
  closeNav,
  getUrlForApp,
  navigateToApp,
  navigateToUrl,
  branding,
  workspaces,
  ...observables
}: Props) {
  const navLinks = useObservable(observables.navLinks$, []).filter((link) => !link.hidden);
  const recentlyAccessed = useObservable(observables.recentlyAccessed$, []);
  const workspaceEnabled = useObservable(workspaces.workspaceEnabled$, false);
  const currentWorkspaceId = useObservable(workspaces.currentWorkspaceId$, '');
  const allNavLinks: CollapsibleNavLink[] = [...navLinks];
  if (!workspaceEnabled || currentWorkspaceId !== MANAGEMENT_WORKSPACE_ID) {
    // no recently visited in management workspace
    if (recentlyAccessed.length) {
      allNavLinks.push(
        ...recentlyAccessed.map((link) => createRecentChromeNavLink(link, navLinks, basePath))
      );
    } else {
      allNavLinks.push(emptyRecentlyVisited);
    }
  }

  const appId = useObservable(observables.appId$, '');
  const lockRef = useRef<HTMLButtonElement>(null);
  const groupedNavLinks = groupBy(allNavLinks, (link) => link?.category?.id);
  const { undefined: uncategorizedLinks = [], ...allCategorizedLinks } = groupedNavLinks;
  const categoryDictionary = getAllCategories(allCategorizedLinks);
  const orderedCategories = getOrderedCategories(allCategorizedLinks, categoryDictionary);
  const mergedNavLinks = getMergedNavLinks(
    orderedCategories,
    uncategorizedLinks,
    categoryDictionary
  );

  const readyForEUI = (link: CollapsibleNavLink, needsIcon: boolean = false) => {
    return createEuiListItem({
      link,
      appId,
      dataTestSubj: 'collapsibleNavAppLink',
      navigateToApp,
      onClick: closeNav,
      ...(needsIcon && { basePath }),
    });
  };

  const DEFAULT_OPENSEARCH_MARK = `${branding.assetFolderUrl}/opensearch_mark_default_mode.svg`;
  const DARKMODE_OPENSEARCH_MARK = `${branding.assetFolderUrl}/opensearch_mark_dark_mode.svg`;

  const darkMode = branding.darkMode;
  const markDefault = branding.mark?.defaultUrl;
  const markDarkMode = branding.mark?.darkModeUrl;

  /**
   * Use branding configurations to check which URL to use for rendering
   * side menu opensearch logo in default mode
   *
   * @returns a valid custom URL or original default mode opensearch mark if no valid URL is provided
   */
  const customSideMenuLogoDefaultMode = () => {
    return markDefault ?? DEFAULT_OPENSEARCH_MARK;
  };

  /**
   * Use branding configurations to check which URL to use for rendering
   * side menu opensearch logo in dark mode
   *
   * @returns a valid custom URL or original dark mode opensearch mark if no valid URL is provided
   */
  const customSideMenuLogoDarkMode = () => {
    return markDarkMode ?? markDefault ?? DARKMODE_OPENSEARCH_MARK;
  };

  /**
   * Render custom side menu logo for both default mode and dark mode
   *
   * @returns a valid logo URL
   */
  const customSideMenuLogo = () => {
    return darkMode ? customSideMenuLogoDarkMode() : customSideMenuLogoDefaultMode();
  };

  return (
    <EuiCollapsibleNav
      data-test-subj="collapsibleNav"
      id={id}
      aria-label={i18n.translate('core.ui.primaryNav.screenReaderLabel', {
        defaultMessage: 'Primary',
      })}
      isOpen={isNavOpen}
      isDocked={isLocked}
      onClose={closeNav}
      outsideClickCloses={false}
    >
      <EuiFlexItem className="eui-yScroll">
        <CollapsibleNavHeader workspaces={workspaces} />

        {/* merged NavLinks */}
        {mergedNavLinks.map((item, i) => {
          if (typeof item === 'string') {
            const category = categoryDictionary[item]!;
            const opensearchLinkLogo =
              category.id === 'opensearchDashboards' ? customSideMenuLogo() : category.euiIconType;

            return (
              <EuiCollapsibleNavGroup
                key={category.id}
                iconType={opensearchLinkLogo}
                title={category.label}
                isCollapsible={true}
                initialIsOpen={getIsCategoryOpen(category.id, storage)}
                onToggle={(isCategoryOpen) =>
                  setIsCategoryOpen(category.id, isCategoryOpen, storage)
                }
                data-test-subj={`collapsibleNavGroup-${category.id}`}
                data-test-opensearch-logo={opensearchLinkLogo}
              >
                <EuiListGroup
                  aria-label={i18n.translate('core.ui.primaryNavSection.screenReaderLabel', {
                    defaultMessage: 'Primary navigation links, {category}',
                    values: { category: category.label },
                  })}
                  listItems={allCategorizedLinks[item].map((link) => readyForEUI(link))}
                  maxWidth="none"
                  color="subdued"
                  gutterSize="none"
                  size="s"
                />
              </EuiCollapsibleNavGroup>
            );
          } else {
            return (
              <EuiCollapsibleNavGroup data-test-subj={`collapsibleNavGroup-noCategory`} key={i}>
                <EuiListGroup flush>
                  <EuiListGroupItem color="text" size="s" {...readyForEUI(item, true)} />
                </EuiListGroup>
              </EuiCollapsibleNavGroup>
            );
          }
        })}

        {/* Docking button only for larger screens that can support it*/}
        <EuiShowFor sizes={['l', 'xl']}>
          <EuiCollapsibleNavGroup>
            <EuiListGroup flush>
              <EuiListGroupItem
                data-test-subj="collapsible-nav-lock"
                buttonRef={lockRef}
                size="xs"
                color="subdued"
                label={
                  isLocked
                    ? i18n.translate('core.ui.primaryNavSection.undockLabel', {
                        defaultMessage: 'Undock navigation',
                      })
                    : i18n.translate('core.ui.primaryNavSection.dockLabel', {
                        defaultMessage: 'Dock navigation',
                      })
                }
                aria-label={
                  isLocked
                    ? i18n.translate('core.ui.primaryNavSection.undockAriaLabel', {
                        defaultMessage: 'Undock primary navigation',
                      })
                    : i18n.translate('core.ui.primaryNavSection.dockAriaLabel', {
                        defaultMessage: 'Dock primary navigation',
                      })
                }
                onClick={() => {
                  onIsLockedUpdate(!isLocked);
                  if (lockRef.current) {
                    lockRef.current.focus();
                  }
                }}
                iconType={isLocked ? 'lock' : 'lockOpen'}
              />
            </EuiListGroup>
          </EuiCollapsibleNavGroup>
        </EuiShowFor>
      </EuiFlexItem>
    </EuiCollapsibleNav>
  );
}

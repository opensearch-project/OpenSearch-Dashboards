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
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItem,
  EuiShowFor,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { groupBy, sortBy } from 'lodash';
import React, { Fragment, useRef } from 'react';
import useObservable from 'react-use/lib/useObservable';
import * as Rx from 'rxjs';
import { DEFAULT_APP_CATEGORIES } from '../../../../utils';
import { ChromeNavLink, ChromeRecentlyAccessedHistoryItem } from '../..';
import { AppCategory } from '../../../../types';
import { InternalApplicationStart } from '../../../application';
import { HttpStart } from '../../../http';
import { OnIsLockedUpdate } from './';
import type { Logos } from '../../../../common';
import {
  createEuiListItem,
  createRecentChromeNavLink,
  emptyRecentlyVisited,
  CollapsibleNavLink,
} from './nav_link';

function getAllCategories(allCategorizedLinks: Record<string, CollapsibleNavLink[]>) {
  const allCategories = {} as Record<string, AppCategory | undefined>;

  for (const [key, value] of Object.entries(allCategorizedLinks)) {
    allCategories[key] = value[0].category;
  }

  return allCategories;
}

function getSortedLinksAndCategories(
  uncategorizedLinks: CollapsibleNavLink[],
  categoryDictionary: ReturnType<typeof getAllCategories>
): Array<AppCategory | CollapsibleNavLink> {
  // uncategorized links and categories are ranked according the order
  // if order is not defined, categories will be placed above uncategorized links
  const categories = Object.values(categoryDictionary).filter(
    (category) => category !== undefined
  ) as AppCategory[];
  const uncategorizedLinksWithOrder = uncategorizedLinks.filter((link) => link.order !== null);
  const uncategorizedLinksWithoutOrder = uncategorizedLinks.filter((link) => link.order === null);
  const categoriesWithOrder = categories.filter((category) => category.order !== null);
  const categoriesWithoutOrder = categories.filter((category) => category.order === null);
  const sortedLinksAndCategories = sortBy(
    [...uncategorizedLinksWithOrder, ...categoriesWithOrder],
    'order'
  );
  return [
    ...sortedLinksAndCategories,
    ...categoriesWithoutOrder,
    ...uncategorizedLinksWithoutOrder,
  ];
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
  collapsibleNavHeaderRender?: () => JSX.Element | null;
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
  logos: Logos;
}

export function CollapsibleNav({
  basePath,
  collapsibleNavHeaderRender,
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
  logos,
  ...observables
}: Props) {
  const navLinks = useObservable(observables.navLinks$, []).filter((link) => !link.hidden);
  let customNavLink = useObservable(observables.customNavLink$, undefined);
  if (customNavLink) {
    customNavLink = { ...customNavLink, externalLink: true };
  }
  const recentlyAccessed = useObservable(observables.recentlyAccessed$, []);
  const allNavLinks: CollapsibleNavLink[] = [...navLinks];
  if (recentlyAccessed.length) {
    allNavLinks.push(
      ...recentlyAccessed.map((link) => createRecentChromeNavLink(link, navLinks, basePath))
    );
  } else {
    allNavLinks.push(emptyRecentlyVisited);
  }
  const appId = useObservable(observables.appId$, '');
  const lockRef = useRef<HTMLButtonElement>(null);
  const groupedNavLinks = groupBy(allNavLinks, (link) => link?.category?.id);
  const { undefined: uncategorizedLinks = [], ...allCategorizedLinks } = groupedNavLinks;
  const categoryDictionary = getAllCategories(allCategorizedLinks);
  const sortedLinksAndCategories = getSortedLinksAndCategories(
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

  const defaultHeaderName = i18n.translate(
    'core.ui.primaryNav.workspacePickerMenu.defaultHeaderName',
    {
      defaultMessage: 'OpenSearch Dashboards',
    }
  );

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
      {collapsibleNavHeaderRender ? (
        collapsibleNavHeaderRender()
      ) : (
        <EuiCollapsibleNavGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiIcon type="logoOpenSearch" size="l" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText>
                <strong> {defaultHeaderName} </strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiCollapsibleNavGroup>
      )}

      {customNavLink && (
        <Fragment>
          <EuiFlexItem grow={false} style={{ flexShrink: 0 }}>
            <EuiCollapsibleNavGroup
              background="light"
              className="eui-yScroll"
              style={{ maxHeight: '40vh' }}
            >
              <EuiListGroup
                listItems={[
                  createEuiListItem({
                    link: customNavLink,
                    basePath,
                    navigateToApp,
                    dataTestSubj: 'collapsibleNavCustomNavLink',
                    onClick: closeNav,
                  }),
                ]}
                maxWidth="none"
                color="text"
                gutterSize="none"
                size="s"
              />
            </EuiCollapsibleNavGroup>
          </EuiFlexItem>

          <EuiHorizontalRule margin="none" />
        </Fragment>
      )}

      <EuiFlexItem className="eui-yScroll">
        {sortedLinksAndCategories.map((item, i) => {
          if (!('href' in item)) {
            // CollapsibleNavLink has href property, while AppCategory does not have
            const category = item;
            const opensearchLinkLogo =
              category.id === DEFAULT_APP_CATEGORIES.opensearchDashboards.id
                ? logos.Mark.url
                : category.euiIconType;

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
                  listItems={allCategorizedLinks[item.id].map((link) => readyForEUI(link))}
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

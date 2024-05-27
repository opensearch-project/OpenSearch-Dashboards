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
  EuiCollapsibleNavGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiListGroup,
  EuiListGroupItem,
  EuiShowFor,
  EuiText,
  EuiFlyout,
  EuiButtonIcon,
  EuiFlexGroup,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { groupBy, sortBy } from 'lodash';
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import * as Rx from 'rxjs';
import { ChromeNavLink, ChromeRecentlyAccessedHistoryItem } from '../..';
import { AppCategory } from '../../../../types';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { OnIsLockedUpdate } from './';
import { createEuiListItem, createRecentNavLink, isModifiedOrPrevented } from './nav_link';
import type { Logos } from '../../../../common/types';

function getAllCategories(allCategorizedLinks: Record<string, ChromeNavLink[]>) {
  const allCategories = {} as Record<string, AppCategory | undefined>;

  for (const [key, value] of Object.entries(allCategorizedLinks)) {
    allCategories[key] = value[0].category;
  }

  return allCategories;
}

function getOrderedCategories(
  mainCategories: Record<string, ChromeNavLink[]>,
  categoryDictionary: ReturnType<typeof getAllCategories>
) {
  return sortBy(
    Object.keys(mainCategories),
    (categoryName) => categoryDictionary[categoryName]?.order
  );
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
  navigateToApp,
  navigateToUrl,
  logos,
  ...observables
}: Props) {
  const navLinks = useObservable(observables.navLinks$, []).filter((link) => !link.hidden);
  const recentlyAccessed = useObservable(observables.recentlyAccessed$, []);
  const customNavLink = useObservable(observables.customNavLink$, undefined);
  const appId = useObservable(observables.appId$, '');
  const lockRef = useRef<HTMLButtonElement>(null);
  const groupedNavLinks = groupBy(navLinks, (link) => link?.category?.id);
  const { undefined: unknowns = [], ...allCategorizedLinks } = groupedNavLinks;
  const categoryDictionary = getAllCategories(allCategorizedLinks);
  const orderedCategories = getOrderedCategories(allCategorizedLinks, categoryDictionary);
  const [focusGroup, setFocusGroup] = useState('');
  const [shouldShrinkSecondNavigation, setShouldShrinkSecondNavigation] = useState(false);
  const readyForEUI = (link: ChromeNavLink, needsIcon: boolean = false) => {
    return createEuiListItem({
      link,
      appId,
      dataTestSubj: 'collapsibleNavAppLink',
      navigateToApp,
      onClick: closeNav,
      ...(needsIcon && { basePath }),
    });
  };

  useEffect(() => {
    if (appId) {
      const findApp = navLinks.find((link) => link.id === appId);
      setFocusGroup(findApp?.category?.group?.id || '');
    }
  }, [appId]);

  let categoriesWithGroup: AppCategory[] = [];

  const groupMap: Record<string, AppCategory> = {};

  orderedCategories.forEach((categoryName) => {
    const category = categoryDictionary[categoryName]!;
    if (category.group) {
      categoriesWithGroup.push(category);
      groupMap[category.group.id] = category.group;
    }
  });

  categoriesWithGroup = categoriesWithGroup.reduce(
    (accumulator: AppCategory[], currentValue: AppCategory) => {
      const idMap = new Map<string, boolean>();
      accumulator.forEach((obj) => idMap.set(obj.id, true));

      if (!idMap.has(currentValue.id)) {
        accumulator.push(currentValue);
      }

      return accumulator;
    },
    []
  );

  const groupWithCategory: Record<string, AppCategory[]> = groupBy(categoriesWithGroup, 'group.id');

  const secondNavigation = focusGroup ? (
    <>
      {shouldShrinkSecondNavigation ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 16,
          }}
        >
          <EuiButtonIcon
            color="text"
            iconType="menuRight"
            onClick={() => setShouldShrinkSecondNavigation(false)}
          />
        </div>
      ) : null}
      {!shouldShrinkSecondNavigation && (
        <>
          <div className="euiCollapsibleNavGroup euiCollapsibleNavGroup--light euiCollapsibleNavGroup--withHeading">
            <EuiFlexGroup alignItems="center">
              <EuiFlexItem>
                <h3 className="euiAccordion__triggerWrapper euiCollapsibleNavGroup__title">
                  {groupMap[focusGroup].label}
                </h3>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  color="text"
                  iconType="menuLeft"
                  onClick={() => setShouldShrinkSecondNavigation(true)}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
          {groupWithCategory[focusGroup].map((category) => {
            return (
              <EuiCollapsibleNavGroup
                title={category.label}
                isCollapsible={true}
                initialIsOpen={true}
                className="accordion-in-context-menu"
                key={category.id}
              >
                <EuiListGroup
                  listItems={allCategorizedLinks[category.id]?.map((link) => readyForEUI(link))}
                  maxWidth="none"
                  color="subdued"
                  gutterSize="none"
                  size="s"
                />
              </EuiCollapsibleNavGroup>
            );
          })}
        </>
      )}
    </>
  ) : null;

  const secondNavigationWidth = useMemo(() => {
    if (shouldShrinkSecondNavigation) {
      return 48;
    }

    return 320;
  }, [shouldShrinkSecondNavigation]);

  const flyoutSize = useMemo(() => {
    if (focusGroup) {
      return 320 + secondNavigationWidth;
    }

    return 320;
  }, [focusGroup, secondNavigationWidth]);

  return (
    <>
      {isNavOpen || isLocked ? (
        <EuiFlyout
          data-test-subj="collapsibleNav"
          id={id}
          side="left"
          aria-label={i18n.translate('core.ui.primaryNav.screenReaderLabel', {
            defaultMessage: 'Primary',
          })}
          type={isLocked ? 'push' : 'overlay'}
          onClose={closeNav}
          outsideClickCloses={false}
          className="context-nav-wrapper"
          size={flyoutSize}
          closeButtonPosition="outside"
          hideCloseButton={isLocked}
        >
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: 320 }}>
              {collapsibleNavHeaderRender && collapsibleNavHeaderRender()}
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
                            externalLink: true,
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

              {/* Recently viewed */}
              {/* <EuiCollapsibleNavGroup
                key="recentlyViewed"
                background="light"
                title={i18n.translate('core.ui.recentlyViewed', {
                  defaultMessage: 'Recently viewed',
                })}
                isCollapsible={true}
                initialIsOpen={getIsCategoryOpen('recentlyViewed', storage)}
                onToggle={(isCategoryOpen) =>
                  setIsCategoryOpen('recentlyViewed', isCategoryOpen, storage)
                }
                data-test-subj="collapsibleNavGroup-recentlyViewed"
              >
                {recentlyAccessed.length > 0 ? (
                  <EuiListGroup
                    aria-label={i18n.translate('core.ui.recentlyViewedAriaLabel', {
                      defaultMessage: 'Recently viewed links',
                    })}
                    listItems={recentlyAccessed.map((link) => {
                      // TODO #64541
                      // Can remove icon from recent links completely
                      const { iconType, onClick, ...hydratedLink } = createRecentNavLink(
                        link,
                        navLinks,
                        basePath,
                        navigateToUrl
                      );

                      return {
                        ...hydratedLink,
                        'data-test-subj': 'collapsibleNavAppLink--recent',
                        onClick: (event) => {
                          if (!isModifiedOrPrevented(event)) {
                            closeNav();
                            onClick(event);
                          }
                        },
                      };
                    })}
                    maxWidth="none"
                    color="subdued"
                    gutterSize="none"
                    size="s"
                    className="osdCollapsibleNav__recentsListGroup"
                  />
                ) : (
                  <EuiText size="s" color="subdued" style={{ padding: '0 8px 8px' }}>
                    <p>
                      {i18n.translate('core.ui.EmptyRecentlyViewed', {
                        defaultMessage: 'No recently viewed items',
                      })}
                    </p>
                  </EuiText>
                )}
              </EuiCollapsibleNavGroup>

              <EuiHorizontalRule margin="none" /> */}

              <EuiFlexItem className="eui-yScroll">
                {/* OpenSearchDashboards, Observability, Security, and Management sections */}
                {orderedCategories
                  .filter((categoryName) => {
                    const category = categoryDictionary[categoryName]!;
                    return !category.group;
                  })
                  .map((categoryName) => {
                    const category = categoryDictionary[categoryName]!;
                    const opensearchLinkLogo =
                      category.id === 'opensearchDashboards'
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
                          aria-label={i18n.translate(
                            'core.ui.primaryNavSection.screenReaderLabel',
                            {
                              defaultMessage: 'Primary navigation links, {category}',
                              values: { category: category.label },
                            }
                          )}
                          listItems={allCategorizedLinks[categoryName].map((link) =>
                            readyForEUI(link)
                          )}
                          maxWidth="none"
                          color="subdued"
                          gutterSize="none"
                          size="s"
                        />
                      </EuiCollapsibleNavGroup>
                    );
                  })}

                {/* Things with no category (largely for custom plugins) */}
                {unknowns.map((link, i) => (
                  <EuiCollapsibleNavGroup data-test-subj={`collapsibleNavGroup-noCategory`} key={i}>
                    <EuiListGroup flush>
                      <EuiListGroupItem color="text" size="s" {...readyForEUI(link, true)} />
                    </EuiListGroup>
                  </EuiCollapsibleNavGroup>
                ))}
                {Object.values(groupMap).map((group) => (
                  <EuiCollapsibleNavGroup
                    key={group.id}
                    initialIsOpen={false}
                    isCollapsible
                    forceState="closed"
                    title={group.label}
                    onToggle={() => {
                      if (focusGroup === group.id) {
                        setFocusGroup('');
                      } else {
                        setFocusGroup(group.id);
                      }
                    }}
                  />
                ))}
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
            </div>
            {secondNavigation && (
              <div
                className="second-navigation"
                style={{ width: secondNavigationWidth, overflowY: 'auto', overflowX: 'hidden' }}
              >
                {secondNavigation}
              </div>
            )}
          </div>
        </EuiFlyout>
      ) : null}
      {secondNavigation && !isLocked ? (
        <EuiFlyout
          className="context-nav-wrapper"
          type="push"
          onClose={() => {}}
          size={secondNavigationWidth}
          side="left"
          hideCloseButton
        >
          {secondNavigation}
        </EuiFlyout>
      ) : null}
    </>
  );
}

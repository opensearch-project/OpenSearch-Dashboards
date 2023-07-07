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
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { groupBy, sortBy } from 'lodash';
import React, { useRef } from 'react';
import useObservable from 'react-use/lib/useObservable';
import * as Rx from 'rxjs';
import { ChromeNavLink, ChromeRecentlyAccessedHistoryItem } from '../..';
import { AppCategory } from '../../../../types';
import { InternalApplicationStart } from '../../../application';
import { HttpStart } from '../../../http';
import { OnIsLockedUpdate } from './';
import { createEuiListItem, isModifiedOrPrevented, createWorkspaceNavLink } from './nav_link';
import { ChromeBranding } from '../../chrome_service';
import { WorkspaceAttribute } from '../../../workspace';
import { WORKSPACE_APP_ID, PATHS } from '../../constants';

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
  branding: ChromeBranding;
  exitWorkspace: () => void;
  getWorkspaceUrl: (id: string) => string;
  currentWorkspace$: Rx.BehaviorSubject<WorkspaceAttribute | null>;
  workspaceList$: Rx.BehaviorSubject<WorkspaceAttribute[]>;
}

export function CollapsibleNav({
  basePath,
  id,
  isLocked,
  isNavOpen,
  homeHref,
  storage = window.localStorage,
  onIsLockedUpdate,
  exitWorkspace,
  getWorkspaceUrl,
  closeNav,
  navigateToApp,
  navigateToUrl,
  branding,
  ...observables
}: Props) {
  const navLinks = useObservable(observables.navLinks$, []).filter((link) => !link.hidden);
  const appId = useObservable(observables.appId$, '');
  const currentWorkspace = useObservable(observables.currentWorkspace$);
  const workspaceList = useObservable(observables.workspaceList$, []).slice(0, 5);
  const lockRef = useRef<HTMLButtonElement>(null);
  const filteredLinks = getFilterLinks(currentWorkspace, navLinks);
  const groupedNavLinks = groupBy(filteredLinks, (link) => link?.category?.id);
  const { undefined: unknowns = [], ...allCategorizedLinks } = groupedNavLinks;
  const categoryDictionary = getAllCategories(allCategorizedLinks);
  const orderedCategories = getOrderedCategories(allCategorizedLinks, categoryDictionary);

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

  const DEFAULT_OPENSEARCH_MARK = `${branding.assetFolderUrl}/opensearch_mark_default_mode.svg`;
  const DARKMODE_OPENSEARCH_MARK = `${branding.assetFolderUrl}/opensearch_mark_dark_mode.svg`;

  const darkMode = branding.darkMode;
  const markDefault = branding.mark?.defaultUrl;
  const markDarkMode = branding.mark?.darkModeUrl;

  function getFilterLinks(
    workspace: WorkspaceAttribute | null | undefined,
    allNavLinks: ChromeNavLink[]
  ) {
    if (!workspace) return allNavLinks;

    const features = workspace.features ?? [];
    const links = allNavLinks.filter((item) => features.indexOf(item.id) > -1);
    return links;
  }

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
        {/* Home, Alerts, Favorites, Projects and Admin outside workspace */}
        {!currentWorkspace && (
          <>
            <EuiCollapsibleNavGroup
              onClick={async () => {
                closeNav();
                await navigateToApp('home');
              }}
              iconType={'logoOpenSearch'}
              title={i18n.translate('core.ui.primaryNavSection.home', {
                defaultMessage: 'Home',
              })}
            />
            <EuiCollapsibleNavGroup
              onClick={closeNav}
              iconType={'bell'}
              title={i18n.translate('core.ui.primaryNavSection.alerts', {
                defaultMessage: 'Alerts',
              })}
            />
            <EuiCollapsibleNavGroup
              iconType={'starEmpty'}
              title={i18n.translate('core.ui.primaryNavSection.favorites', {
                defaultMessage: 'Favorites',
              })}
              isCollapsible={true}
              initialIsOpen={true}
            >
              <EuiText size="s" color="subdued" style={{ padding: '0 8px 8px' }}>
                <p>
                  {i18n.translate('core.ui.EmptyFavoriteList', {
                    defaultMessage: 'No Favorites',
                  })}
                </p>
              </EuiText>
              <EuiText size="s" color="subdued" style={{ padding: '0 8px 8px' }}>
                <p>
                  {i18n.translate('core.ui.SeeMoreFavorite', {
                    defaultMessage: 'SEE MORE',
                  })}
                </p>
              </EuiText>
            </EuiCollapsibleNavGroup>
            <EuiCollapsibleNavGroup
              iconType={'folderClosed'}
              title={i18n.translate('core.ui.primaryNavSection.workspaces', {
                defaultMessage: 'Workspaces',
              })}
              isCollapsible={true}
              initialIsOpen={true}
            >
              {workspaceList?.length > 0 ? (
                <EuiListGroup
                  aria-label={i18n.translate('core.ui.WorkspaceList', {
                    defaultMessage: 'Workspace list links',
                  })}
                  listItems={workspaceList.map((workspace) => {
                    const href = getWorkspaceUrl(workspace.id);
                    const hydratedLink = createWorkspaceNavLink(href, workspace, navLinks);
                    return {
                      href,
                      ...hydratedLink,
                      'data-test-subj': 'collapsibleNavAppLink--workspace',
                      onClick: async (event) => {
                        if (!isModifiedOrPrevented(event)) {
                          closeNav();
                        }
                      },
                    };
                  })}
                  maxWidth="none"
                  color="subdued"
                  gutterSize="none"
                  size="s"
                />
              ) : (
                <EuiText size="s" color="subdued" style={{ padding: '0 8px 8px' }}>
                  <p>
                    {i18n.translate('core.ui.EmptyWorkspaceList', {
                      defaultMessage: 'No Workspaces',
                    })}
                  </p>
                </EuiText>
              )}
              <EuiText
                size="s"
                color="subdued"
                style={{ padding: '0 8px 8px' }}
                onClick={async () => {
                  await navigateToApp(WORKSPACE_APP_ID, {
                    path: PATHS.list,
                  });
                }}
              >
                <p>
                  {i18n.translate('core.ui.SeeMoreWorkspace', {
                    defaultMessage: 'SEE MORE',
                  })}
                </p>
              </EuiText>
            </EuiCollapsibleNavGroup>
            <EuiCollapsibleNavGroup
              onClick={closeNav}
              iconType={'managementApp'}
              title={i18n.translate('core.ui.primaryNavSection.admin', {
                defaultMessage: 'Admin',
              })}
            />
          </>
        )}

        {/* Workspace name and Overview inside workspace */}
        {currentWorkspace && (
          <>
            <EuiCollapsibleNavGroup iconType={'folderClosed'} title={currentWorkspace.name} />
            <EuiCollapsibleNavGroup
              onClick={() => {
                window.location.href = getWorkspaceUrl(currentWorkspace.id);
              }}
              iconType={'grid'}
              title={i18n.translate('core.ui.primaryNavSection.overview', {
                defaultMessage: 'Overview',
              })}
            />
          </>
        )}

        {/* OpenSearchDashboards, Observability, Security, and Management sections inside workspace */}
        {currentWorkspace &&
          orderedCategories.map((categoryName) => {
            const category = categoryDictionary[categoryName]!;
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
                  listItems={allCategorizedLinks[categoryName].map((link) => readyForEUI(link))}
                  maxWidth="none"
                  color="subdued"
                  gutterSize="none"
                  size="s"
                />
              </EuiCollapsibleNavGroup>
            );
          })}

        {/* Things with no category (largely for custom plugins) inside workspace */}
        {currentWorkspace &&
          unknowns.map((link, i) => (
            <EuiCollapsibleNavGroup data-test-subj={`collapsibleNavGroup-noCategory`} key={i}>
              <EuiListGroup flush>
                <EuiListGroupItem color="text" size="s" {...readyForEUI(link, true)} />
              </EuiListGroup>
            </EuiCollapsibleNavGroup>
          ))}

        <EuiCollapsibleNavGroup>
          <EuiListGroup flush>
            {/* Exit workspace button only within a workspace*/}
            {currentWorkspace && (
              <EuiListGroupItem
                data-test-subj="collapsible-nav-exit"
                size="xs"
                color="subdued"
                label={i18n.translate('core.ui.primaryNavSection.exitWorkspaceLabel', {
                  defaultMessage: 'Exit workspace',
                })}
                aria-label={i18n.translate('core.ui.primaryNavSection.exitWorkspaceLabel', {
                  defaultMessage: 'Exit workspace',
                })}
                onClick={exitWorkspace}
                iconType={'exit'}
              />
            )}
            {/* Docking button only for larger screens that can support it*/}
            {
              <EuiShowFor sizes={['l', 'xl']}>
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
              </EuiShowFor>
            }
          </EuiListGroup>
        </EuiCollapsibleNavGroup>
      </EuiFlexItem>
    </EuiCollapsibleNav>
  );
}

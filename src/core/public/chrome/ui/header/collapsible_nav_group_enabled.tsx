/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './collapsible_nav_group_enabled.scss';
import {
  EuiCollapsibleNavGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiListGroup,
  EuiListGroupItem,
  EuiShowFor,
  EuiFlyout,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiSideNavItemType,
  EuiSideNav,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { sortBy } from 'lodash';
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import * as Rx from 'rxjs';
import { ChromeNavLink } from '../..';
import { ChromeNavGroup, NavGroupType } from '../../../../types';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { OnIsLockedUpdate } from './';
import { createEuiListItem } from './nav_link';
import type { Logos } from '../../../../common/types';
import { CollapsibleNavHeaderRender } from '../../chrome_service';
import { NavGroupItemInMap } from '../../nav_group';
import {
  fulfillRegistrationLinksToChromeNavLinks,
  getOrderedLinksOrCategories,
  LinkItem,
  LinkItemType,
} from '../../utils';

interface Props {
  appId$: InternalApplicationStart['currentAppId$'];
  basePath: HttpStart['basePath'];
  collapsibleNavHeaderRender?: CollapsibleNavHeaderRender;
  id: string;
  isLocked: boolean;
  isNavOpen: boolean;
  navLinks$: Rx.Observable<ChromeNavLink[]>;
  storage?: Storage;
  onIsLockedUpdate: OnIsLockedUpdate;
  closeNav: () => void;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  navigateToUrl: InternalApplicationStart['navigateToUrl'];
  customNavLink$: Rx.Observable<ChromeNavLink | undefined>;
  logos: Logos;
  navGroupsMap$: Rx.Observable<Record<string, NavGroupItemInMap>>;
}

interface NavGroupsProps {
  navLinks: ChromeNavLink[];
  suffix?: React.ReactElement;
  style?: React.CSSProperties;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  onClick: () => void;
}

function NavGroups({ navLinks, suffix, style, appId, navigateToApp, onClick }: NavGroupsProps) {
  const createNavItem = ({ link }: { link: ChromeNavLink }) => {
    const euiListItem = createEuiListItem({
      link,
      appId,
      dataTestSubj: 'collapsibleNavAppLink',
      navigateToApp,
      onClick,
    });

    return {
      id: link.id,
      name: <div className="padding-horizontal">{link.title}</div>,
      onClick: euiListItem.onClick,
      href: euiListItem.href,
      className: 'no-margin-top',
      isSelected: euiListItem.isActive,
    };
  };
  const orderedLinksOrCategories = getOrderedLinksOrCategories(navLinks);
  const createSideNavItem = (navLink: LinkItem): EuiSideNavItemType<{}> => {
    if (navLink.itemType === LinkItemType.LINK) {
      return createNavItem({
        link: navLink.link,
      });
    }

    if (navLink.itemType === LinkItemType.PARENT_LINK && navLink.link) {
      return {
        ...createNavItem({ link: navLink.link }),
        items: navLink.links.map((subNavLink) => createSideNavItem(subNavLink)),
      };
    }

    if (navLink.itemType === LinkItemType.CATEGORY) {
      return {
        id: navLink.category?.id ?? '',
        name: <div className="padding-horizontal">{navLink.category?.label ?? ''}</div>,
        items: navLink.links?.map((link) => createSideNavItem(link)),
      };
    }

    return {} as EuiSideNavItemType<{}>;
  };
  const sideNavItems = orderedLinksOrCategories
    .map((navLink) => createSideNavItem(navLink))
    .filter((item): item is EuiSideNavItemType<{}> => !!item);
  return (
    <EuiFlexItem className="eui-yScroll" style={style}>
      <EuiSideNav items={sideNavItems} />
      {suffix}
    </EuiFlexItem>
  );
}

export function CollapsibleNavGroupEnabled({
  basePath,
  collapsibleNavHeaderRender,
  id,
  isLocked,
  isNavOpen,
  storage = window.localStorage,
  onIsLockedUpdate,
  closeNav,
  navigateToApp,
  navigateToUrl,
  logos,
  ...observables
}: Props) {
  const navLinks = useObservable(observables.navLinks$, []).filter((link) => !link.hidden);
  const customNavLink = useObservable(observables.customNavLink$, undefined);
  const appId = useObservable(observables.appId$, '');
  const navGroupsMap = useObservable(observables.navGroupsMap$, {});
  const lockRef = useRef<HTMLButtonElement>(null);

  const [focusGroup, setFocusGroup] = useState<ChromeNavGroup | undefined>(undefined);

  const [shouldShrinkSecondNavigation, setShouldShrinkSecondNavigation] = useState(false);

  useEffect(() => {
    if (!focusGroup && appId) {
      const orderedGroups = sortBy(Object.values(navGroupsMap), (group) => group.order);
      const findMatchedGroup = orderedGroups.find(
        (group) => !!group.navLinks.find((navLink) => navLink.id === appId)
      );
      setFocusGroup(findMatchedGroup);
    }
  }, [appId, navGroupsMap, focusGroup]);

  const secondNavigation = focusGroup ? (
    <>
      {shouldShrinkSecondNavigation ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
                  {focusGroup.title}
                </h3>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  color="text"
                  iconType="menuLeft"
                  aria-label="shrink"
                  onClick={() => setShouldShrinkSecondNavigation(true)}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
          <NavGroups
            navLinks={fulfillRegistrationLinksToChromeNavLinks(
              navGroupsMap[focusGroup.id]?.navLinks || [],
              navLinks
            )}
            appId={appId}
            navigateToApp={navigateToApp}
            onClick={closeNav}
          />
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

  const onGroupClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    group: ChromeNavGroup
  ) => {
    const fulfilledLinks = fulfillRegistrationLinksToChromeNavLinks(
      navGroupsMap[group.id]?.navLinks,
      navLinks
    );
    setFocusGroup(group);

    // the `navGroupsMap[group.id]?.navLinks` has already been sorted
    const firstLink = fulfilledLinks[0];
    if (firstLink) {
      const propsForEui = createEuiListItem({
        link: firstLink,
        appId,
        dataTestSubj: 'collapsibleNavAppLink',
        navigateToApp,
      });
      propsForEui.onClick(e);
    }
  };

  const allLinksWithNavGroup = Object.values(navGroupsMap).reduce(
    (total, navGroup) => [...total, ...navGroup.navLinks.map((navLink) => navLink.id)],
    [] as string[]
  );

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

              <NavGroups
                navLinks={navLinks.filter((link) => !allLinksWithNavGroup.includes(link.id))}
                suffix={
                  <div>
                    <EuiCollapsibleNavGroup>
                      <EuiListGroup flush>
                        {sortBy(
                          Object.values(navGroupsMap).filter(
                            (item) => item.type === NavGroupType.SYSTEM
                          ),
                          (navGroup) => navGroup.order
                        ).map((group) => {
                          return (
                            <EuiListGroupItem
                              key={group.id}
                              label={group.title}
                              isActive={group.id === focusGroup?.id}
                              onClick={(e) => {
                                if (focusGroup?.id === group.id) {
                                  setFocusGroup(undefined);
                                } else {
                                  onGroupClick(e, group);
                                }
                              }}
                            />
                          );
                        })}
                      </EuiListGroup>
                    </EuiCollapsibleNavGroup>
                    {collapsibleNavHeaderRender && collapsibleNavHeaderRender()}
                    <EuiCollapsibleNavGroup>
                      <EuiListGroup flush>
                        {sortBy(
                          Object.values(navGroupsMap).filter((item) => !item.type),
                          (navGroup) => navGroup.order
                        ).map((group) => {
                          return (
                            <EuiListGroupItem
                              key={group.id}
                              label={group.title}
                              isActive={group.id === focusGroup?.id}
                              onClick={(e) => {
                                if (focusGroup?.id === group.id) {
                                  setFocusGroup(undefined);
                                } else {
                                  onGroupClick(e, group);
                                }
                              }}
                            />
                          );
                        })}
                      </EuiListGroup>
                    </EuiCollapsibleNavGroup>
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
                  </div>
                }
                navigateToApp={navigateToApp}
                onClick={closeNav}
                appId={appId}
              />
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

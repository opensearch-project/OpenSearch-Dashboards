/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subscription } from 'rxjs';
import { AppCategory, ChromeNavGroup, ChromeNavLink } from 'opensearch-dashboards/public';
import { map, takeUntil } from 'rxjs/operators';
import { IUiSettingsClient } from '../../ui_settings';
import {
  flattenLinksOrCategories,
  fulfillRegistrationLinksToChromeNavLinks,
  getOrderedLinksOrCategories,
} from '../utils';
import { ChromeNavLinks } from '../nav_links';

/** @public */
export interface ChromeRegistrationNavLink {
  id: string;
  title?: string;
  category?: AppCategory;
  order?: number;

  /**
   * link with parentNavLinkId field will be displayed as nested items in navigation.
   */
  parentNavLinkId?: string;
}

export type NavGroupItemInMap = ChromeNavGroup & {
  navLinks: ChromeRegistrationNavLink[];
};

export interface ChromeNavGroupServiceSetupContract {
  addNavLinksToGroup: (navGroup: ChromeNavGroup, navLinks: ChromeRegistrationNavLink[]) => void;
  /**
   * Get a boolean value to indicates whether use case is enabled
   */
  getNavGroupEnabled: () => boolean;
}

export interface ChromeNavGroupServiceStartContract {
  getNavGroupsMap$: () => Observable<Record<string, NavGroupItemInMap>>;
  getNavGroupEnabled: ChromeNavGroupServiceSetupContract['getNavGroupEnabled'];
}

/** @internal */
export class ChromeNavGroupService {
  private readonly navGroupsMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>({});
  private readonly stop$ = new ReplaySubject(1);
  private navLinks$: Observable<Array<Readonly<ChromeNavLink>>> = new BehaviorSubject([]);
  private navGroupEnabled: boolean = false;
  private navGroupEnabledUiSettingsSubscription: Subscription | undefined;
  private addNavLinkToGroup(
    currentGroupsMap: Record<string, NavGroupItemInMap>,
    navGroup: ChromeNavGroup,
    navLink: ChromeRegistrationNavLink
  ) {
    const matchedGroup = currentGroupsMap[navGroup.id];
    if (matchedGroup) {
      const links = matchedGroup.navLinks;
      const isLinkExistInGroup = links.some((link) => link.id === navLink.id);
      if (isLinkExistInGroup) {
        // eslint-disable-next-line no-console
        console.warn(
          `[ChromeService] Navlink of ${navLink.id} has already been registered in group ${navGroup.id}`
        );
        return currentGroupsMap;
      }
      matchedGroup.navLinks.push(navLink);
    } else {
      currentGroupsMap[navGroup.id] = {
        ...navGroup,
        navLinks: [navLink],
      };
    }

    return currentGroupsMap;
  }
  private getSortedNavGroupsMap$() {
    return combineLatest([this.navGroupsMap$, this.navLinks$])
      .pipe(takeUntil(this.stop$))
      .pipe(
        map(([navGroupsMap, navLinks]) => {
          return Object.keys(navGroupsMap).reduce((sortedNavGroupsMap, navGroupId) => {
            const navGroup = navGroupsMap[navGroupId];
            const sortedNavLinks = getOrderedLinksOrCategories(
              fulfillRegistrationLinksToChromeNavLinks(navGroup.navLinks, navLinks)
            );
            sortedNavGroupsMap[navGroupId] = {
              ...navGroup,
              navLinks: flattenLinksOrCategories(sortedNavLinks),
            };
            return sortedNavGroupsMap;
          }, {} as Record<string, NavGroupItemInMap>);
        })
      );
  }
  setup({ uiSettings }: { uiSettings: IUiSettingsClient }): ChromeNavGroupServiceSetupContract {
    this.navGroupEnabledUiSettingsSubscription = uiSettings
      .get$('home:useNewHomePage', false)
      .subscribe((value) => {
        this.navGroupEnabled = value;
      });

    return {
      addNavLinksToGroup: (navGroup: ChromeNavGroup, navLinks: ChromeRegistrationNavLink[]) => {
        // Construct a new groups map pointer.
        const currentGroupsMap = { ...this.navGroupsMap$.getValue() };

        const navGroupsMapAfterAdd = navLinks.reduce(
          (groupsMap, navLink) => this.addNavLinkToGroup(groupsMap, navGroup, navLink),
          currentGroupsMap
        );

        this.navGroupsMap$.next(navGroupsMapAfterAdd);
      },
      getNavGroupEnabled: () => this.navGroupEnabled,
    };
  }
  async start({
    navLinks,
  }: {
    navLinks: ChromeNavLinks;
  }): Promise<ChromeNavGroupServiceStartContract> {
    this.navLinks$ = navLinks.getNavLinks$();
    return {
      getNavGroupsMap$: () => this.getSortedNavGroupsMap$(),
      getNavGroupEnabled: () => this.navGroupEnabled,
    };
  }
  async stop() {
    this.stop$.next();
    this.navGroupEnabledUiSettingsSubscription?.unsubscribe();
  }
}

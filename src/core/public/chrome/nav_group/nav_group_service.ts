/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subscription } from 'rxjs';
import {
  AppCategory,
  ChromeBreadcrumb,
  ChromeNavGroup,
  ChromeNavLink,
} from 'opensearch-dashboards/public';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { i18n } from '@osd/i18n';
import { IUiSettingsClient } from '../../ui_settings';
import {
  flattenLinksOrCategories,
  fulfillRegistrationLinksToChromeNavLinks,
  getOrderedLinksOrCategories,
} from '../utils';
import { ChromeNavLinks } from '../nav_links';
import { InternalApplicationStart } from '../../application';

export const CURRENT_NAV_GROUP_ID = 'core.chrome.currentNavGroupId';

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

export type ChromeNavGroupUpdater = (navGroup: ChromeNavGroup) => Partial<ChromeNavGroup> | void;

export interface ChromeNavGroupServiceSetupContract {
  addNavLinksToGroup: (navGroup: ChromeNavGroup, navLinks: ChromeRegistrationNavLink[]) => void;
  /**
   * Get a boolean value to indicates whether use case is enabled
   */
  getNavGroupEnabled: () => boolean;
  registerNavGroupUpdater: (navGroupUpdater: Observable<ChromeNavGroupUpdater>) => () => void;
}

export interface ChromeNavGroupServiceStartContract {
  getNavGroupsMap$: () => Observable<Record<string, NavGroupItemInMap>>;
  getNavGroupEnabled: ChromeNavGroupServiceSetupContract['getNavGroupEnabled'];
  /**
   * Get an observable of the current selected nav group
   */
  getCurrentNavGroup$: () => Observable<ChromeNavGroup | undefined>;

  /**
   * Set current selected nav group
   * @param navGroupId The id of the nav group to be set as current
   */
  setCurrentNavGroup: (navGroupId: string | undefined) => void;

  /**
   * prepend Home & NavGroup into current breadcrumbs
   * @param breadcrumbs current breadcrumbs
   * @returns new prepend breadcrumbs
   */
  prependCurrentNavGroupToBreadcrumbs: (breadcrumbs: ChromeBreadcrumb[]) => ChromeBreadcrumb[];
}

/** @internal */
export class ChromeNavGroupService {
  private readonly navGroupsMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>({});
  private readonly stop$ = new ReplaySubject(1);
  private navLinks$: Observable<Array<Readonly<ChromeNavLink>>> = new BehaviorSubject([]);
  private navGroupEnabled: boolean = false;
  private navGroupEnabledUiSettingsSubscription: Subscription | undefined;
  private navGroupUpdaters$$ = new BehaviorSubject<Array<Observable<ChromeNavGroupUpdater>>>([]);
  private currentNavGroup$ = new BehaviorSubject<ChromeNavGroup | undefined>(undefined);

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

  private sortNavGroupNavLinks(
    navGroup: NavGroupItemInMap,
    allVaildNavLinks: Array<Readonly<ChromeNavLink>>
  ) {
    return flattenLinksOrCategories(
      getOrderedLinksOrCategories(
        fulfillRegistrationLinksToChromeNavLinks(navGroup.navLinks, allVaildNavLinks)
      )
    );
  }

  private getSortedNavGroupsMap$() {
    return combineLatest([this.getUpdatedNavGroupsMap$(), this.navLinks$])
      .pipe(takeUntil(this.stop$))
      .pipe(
        map(([navGroupsMap, navLinks]) => {
          return Object.keys(navGroupsMap).reduce((sortedNavGroupsMap, navGroupId) => {
            const navGroup = navGroupsMap[navGroupId];
            sortedNavGroupsMap[navGroupId] = {
              ...navGroup,
              navLinks: this.sortNavGroupNavLinks(navGroup, navLinks),
            };
            return sortedNavGroupsMap;
          }, {} as Record<string, NavGroupItemInMap>);
        })
      );
  }

  private getUpdatedNavGroupsMap$() {
    return combineLatest([this.navGroupsMap$, this.navGroupUpdaters$$]).pipe(
      switchMap(([navGroupsMap, updaters$]) => {
        if (updaters$.length === 0) {
          return of(navGroupsMap);
        }
        return combineLatest(updaters$).pipe(
          map((updaters) => {
            return Object.keys(navGroupsMap).reduce<Record<string, NavGroupItemInMap>>(
              (previousValue, currentKey) => ({
                ...previousValue,
                [currentKey]: updaters.reduce(
                  (prevNavGroup, currentUpdater) => ({
                    ...prevNavGroup,
                    ...currentUpdater(prevNavGroup),
                  }),
                  navGroupsMap[currentKey]
                ),
              }),
              {}
            );
          })
        );
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
      registerNavGroupUpdater: (updater$) => {
        this.navGroupUpdaters$$.next([...this.navGroupUpdaters$$.getValue(), updater$]);
        return () => {
          this.navGroupUpdaters$$.next(
            this.navGroupUpdaters$$.getValue().filter((item) => item !== updater$)
          );
        };
      },
    };
  }
  async start({
    navLinks,
    application,
  }: {
    navLinks: ChromeNavLinks;
    application: InternalApplicationStart;
  }): Promise<ChromeNavGroupServiceStartContract> {
    this.navLinks$ = navLinks.getNavLinks$();

    const currentNavGroupId = sessionStorage.getItem(CURRENT_NAV_GROUP_ID);
    this.currentNavGroup$ = new BehaviorSubject<ChromeNavGroup | undefined>(
      currentNavGroupId ? this.navGroupsMap$.getValue()[currentNavGroupId] : undefined
    );

    const setCurrentNavGroup = (navGroupId: string | undefined) => {
      const navGroup = navGroupId ? this.navGroupsMap$.getValue()[navGroupId] : undefined;
      if (navGroup) {
        this.currentNavGroup$.next(navGroup);
        sessionStorage.setItem(CURRENT_NAV_GROUP_ID, navGroup.id);
      } else {
        this.currentNavGroup$.next(undefined);
        sessionStorage.removeItem(CURRENT_NAV_GROUP_ID);
      }
    };

    // erase current nav group when switch to home page
    application.currentAppId$.subscribe((appId) => {
      if (appId === 'home') {
        setCurrentNavGroup(undefined);
      }
    });

    return {
      getNavGroupsMap$: () => this.getSortedNavGroupsMap$(),
      getNavGroupEnabled: () => this.navGroupEnabled,

      getCurrentNavGroup$: () => this.currentNavGroup$,
      setCurrentNavGroup,

      prependCurrentNavGroupToBreadcrumbs: (breadcrumbs: ChromeBreadcrumb[]) => {
        const navGroupId = this.currentNavGroup$.getValue()?.id;
        const homeTitle = i18n.translate('core.breadcrumbs.homeTitle', { defaultMessage: 'Home' });
        // home page will not have nav group information

        if (this.navGroupEnabled && navGroupId) {
          const currentNavGroup = this.navGroupsMap$.getValue()[navGroupId];

          // breadcrumb order is home > navgroup > application, navgroup will be second one
          const navGroupInBreadcrumbs =
            breadcrumbs.length > 1 && breadcrumbs[1]?.text === currentNavGroup.title;
          if (!navGroupInBreadcrumbs) {
            const navGroupBreadcrumb: ChromeBreadcrumb = {
              text: currentNavGroup.title,
              onClick: () => {
                if (currentNavGroup.navLinks && currentNavGroup.navLinks.length) {
                  const orderedLinks = this.sortNavGroupNavLinks(
                    currentNavGroup,
                    navLinks.getAll()
                  );
                  application.navigateToApp(orderedLinks[0].id);
                }
              },
            };
            const homeBreadcrumb: ChromeBreadcrumb = {
              text: homeTitle,
              onClick: () => {
                application.navigateToApp('home');
              },
            };
            return [homeBreadcrumb, navGroupBreadcrumb, ...breadcrumbs];
          }
        }
        return breadcrumbs;
      },
    };
  }

  async stop() {
    this.stop$.next();
    this.navGroupEnabledUiSettingsSubscription?.unsubscribe();
  }
}

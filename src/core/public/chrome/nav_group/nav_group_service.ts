/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subscription } from 'rxjs';
import {
  AppCategory,
  ApplicationStart,
  ChromeNavGroup,
  ChromeNavLink,
  WorkspacesStart,
} from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { IUiSettingsClient } from '../../ui_settings';
import {
  fulfillRegistrationLinksToChromeNavLinks,
  getSortedNavLinks,
  getVisibleUseCases,
} from '../utils';
import { ChromeNavLinks } from '../nav_links';
import { InternalApplicationStart } from '../../application';
import { NavGroupStatus, NavGroupType } from '../../../../core/types';
import { ChromeBreadcrumb, ChromeBreadcrumbEnricher } from '../chrome_service';
import { ALL_USE_CASE_ID, DEFAULT_APP_CATEGORIES } from '../../../utils';

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

  /**
   * If the nav link should be shown in 'all' nav group
   */
  showInAllNavGroup?: boolean;
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
  getCurrentNavGroup$: () => Observable<NavGroupItemInMap | undefined>;

  /**
   * Set current selected nav group
   * @param navGroupId The id of the nav group to be set as current
   */
  setCurrentNavGroup: (navGroupId: string | undefined) => void;
}

// Custom category is used for those features not belong to any of use cases in all use case.
// and the custom category should always sit after manage category
const customCategory: AppCategory = {
  id: 'custom',
  label: i18n.translate('core.ui.customNavList.label', { defaultMessage: 'Custom' }),
  order: (DEFAULT_APP_CATEGORIES.manage.order || 0) + 500,
};

/** @internal */
export class ChromeNavGroupService {
  private readonly navGroupsMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>({});
  private readonly stop$ = new ReplaySubject(1);
  private navLinks$: Observable<Array<Readonly<ChromeNavLink>>> = new BehaviorSubject([]);
  private navGroupEnabled: boolean = false;
  private navGroupEnabledUiSettingsSubscription: Subscription | undefined;
  private navGroupUpdaters$$ = new BehaviorSubject<Array<Observable<ChromeNavGroupUpdater>>>([]);
  private currentNavGroup$ = new BehaviorSubject<ChromeNavGroup | undefined>(undefined);
  private currentNavGroupSubscription: Subscription | undefined;
  private currentAppIdSubscription: Subscription | undefined;

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
    navLinks: NavGroupItemInMap['navLinks'],
    allValidNavLinks: Array<Readonly<ChromeNavLink>>
  ) {
    return getSortedNavLinks(fulfillRegistrationLinksToChromeNavLinks(navLinks, allValidNavLinks));
  }

  private getNavLinksForAllUseCase(
    navGroupsMap: Record<string, NavGroupItemInMap>,
    navLinks: Array<Readonly<ChromeNavLink>>
  ) {
    // Note: we need to use a new pointer when `assign navGroupsMap[ALL_USE_CASE_ID]?.navLinks`
    // because we will mutate the array directly in the following code.
    const navLinksResult: ChromeRegistrationNavLink[] = [
      ...(navGroupsMap[ALL_USE_CASE_ID]?.navLinks || []),
    ];

    // Append all the links that do not have use case info to keep backward compatible
    const linkIdsWithNavGroupInfo = Object.values(navGroupsMap).reduce((accumulator, navGroup) => {
      // Nav groups without type will be regarded as use case,
      // we should transform use cases to a category and append links with `showInAllNavGroup: true` under the category
      if (!navGroup.type) {
        // Append use case section into left navigation
        const categoryInfo = {
          id: navGroup.id,
          label: navGroup.title,
          order: navGroup.order,
        };

        const fulfilledLinksOfNavGroup = fulfillRegistrationLinksToChromeNavLinks(
          navGroup.navLinks,
          navLinks
        );

        const linksForAllUseCaseWithinNavGroup: ChromeRegistrationNavLink[] = [];

        fulfilledLinksOfNavGroup.forEach((navLink) => {
          if (!navLink.showInAllNavGroup) {
            return;
          }

          linksForAllUseCaseWithinNavGroup.push({
            ...navLink,
            category: categoryInfo,
          });
        });

        navLinksResult.push(...linksForAllUseCaseWithinNavGroup);

        if (!linksForAllUseCaseWithinNavGroup.length) {
          /**
           * Find if there are any links inside a use case but without a `see all` entry.
           * If so, append these features into custom category as a fallback
           */
          fulfillRegistrationLinksToChromeNavLinks(navGroup.navLinks, navLinks).forEach(
            (navLink) => {
              // Links that already exists in all use case do not need to reappend
              if (navLinksResult.find((navLinkInAll) => navLinkInAll.id === navLink.id)) {
                return;
              }
              navLinksResult.push({
                ...navLink,
                category: customCategory,
              });
            }
          );
        }
      }

      return [...accumulator, ...navGroup.navLinks.map((navLink) => navLink.id)];
    }, [] as string[]);
    navLinks.forEach((navLink) => {
      if (linkIdsWithNavGroupInfo.includes(navLink.id)) {
        return;
      }
      navLinksResult.push({
        ...navLink,
        category: customCategory,
      });
    });

    return navLinksResult;
  }

  private getSortedNavGroupsMap$() {
    return combineLatest([this.getUpdatedNavGroupsMap$(), this.navLinks$])
      .pipe(takeUntil(this.stop$))
      .pipe(
        map(([navGroupsMap, navLinks]) => {
          return Object.keys(navGroupsMap).reduce((sortedNavGroupsMap, navGroupId) => {
            const navGroup = navGroupsMap[navGroupId];
            if (navGroupId === ALL_USE_CASE_ID) {
              sortedNavGroupsMap[navGroupId] = {
                ...navGroup,
                navLinks: this.sortNavGroupNavLinks(
                  this.getNavLinksForAllUseCase(navGroupsMap, navLinks),
                  navLinks
                ),
              };
            } else {
              sortedNavGroupsMap[navGroupId] = {
                ...navGroup,
                navLinks: this.sortNavGroupNavLinks(navGroup.navLinks, navLinks),
              };
            }
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
    breadcrumbsEnricher$,
    workspaces,
  }: {
    navLinks: ChromeNavLinks;
    application: InternalApplicationStart;
    breadcrumbsEnricher$: BehaviorSubject<ChromeBreadcrumbEnricher | undefined>;
    workspaces: WorkspacesStart;
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

    const currentNavGroupSorted$ = combineLatest([
      this.getSortedNavGroupsMap$(),
      this.currentNavGroup$,
    ])
      .pipe(takeUntil(this.stop$))
      .pipe(
        map(([navGroupsMapSorted, currentNavGroup]) => {
          if (currentNavGroup) {
            return navGroupsMapSorted[currentNavGroup.id];
          }
        })
      );

    // when we not in any workspace or workspace is disabled
    if (this.navGroupEnabled && !workspaces.currentWorkspace$.getValue()) {
      this.currentNavGroupSubscription = currentNavGroupSorted$.subscribe((currentNavGroup) => {
        if (currentNavGroup) {
          breadcrumbsEnricher$.next((breadcrumbs) =>
            this.prependCurrentNavGroupToBreadcrumbs(
              breadcrumbs,
              currentNavGroup,
              application.navigateToApp
            )
          );
        } else {
          breadcrumbsEnricher$.next(undefined);
        }
      });
    }

    this.currentAppIdSubscription = combineLatest([
      application.currentAppId$,
      this.getSortedNavGroupsMap$(),
    ]).subscribe(([appId, navGroupMap]) => {
      if (appId && navGroupMap) {
        const appIdNavGroupMap = new Map<string, Set<string>>();
        const visibleUseCases = getVisibleUseCases(navGroupMap);
        const mapAppIdToNavGroup = (navGroup: NavGroupItemInMap) => {
          navGroup.navLinks.forEach((navLink) => {
            const navLinkId = navLink.id;
            const navGroupSet = appIdNavGroupMap.get(navLinkId) || new Set();
            navGroupSet.add(navGroup.id);
            appIdNavGroupMap.set(navLinkId, navGroupSet);
          });
        };
        if (visibleUseCases.length === 1) {
          // The length will be 1 if inside a workspace
          // as workspace plugin will register a filter to only make the selected nav group visible.
          // In order to tell which nav group we are in, we should use the only visible use case if the visibleUseCases.length equals 1.
          visibleUseCases.forEach((navGroup) => mapAppIdToNavGroup(navGroup));
        } else {
          // Nav group of Hidden status should be filtered out when counting navGroups the currentApp belongs to
          Object.values(navGroupMap).forEach((navGroup) => {
            if (navGroup.status === NavGroupStatus.Hidden) {
              return;
            }

            mapAppIdToNavGroup(navGroup);
          });
        }

        const navGroups = appIdNavGroupMap.get(appId);
        if (navGroups && navGroups.size === 1) {
          const navGroupId = navGroups.values().next().value as string;
          /**
           * If
           * 1. workspace enabled
           * 2. outside of workspace: visibleUseCases.length > 1
           * 3. the matched nav group is a use case nav group
           *
           * It means a workspace application is incorrectly opened in global place.
           * We need to set current nav group to undefined to not show the use case nav.
           */
          const navGroupInfo = navGroupMap[navGroupId];
          if (
            application.capabilities.workspaces.enabled &&
            visibleUseCases.length > 1 &&
            navGroupInfo.type !== NavGroupType.SYSTEM
          ) {
            setCurrentNavGroup(undefined);
          } else {
            setCurrentNavGroup(navGroupId);
          }
        } else if (!navGroups) {
          setCurrentNavGroup(undefined);
        }
      }
    });

    return {
      getNavGroupsMap$: () => this.getSortedNavGroupsMap$(),
      getNavGroupEnabled: () => this.navGroupEnabled,

      getCurrentNavGroup$: () => currentNavGroupSorted$,
      setCurrentNavGroup,
    };
  }

  /**
   * prepend current nav group into existing breadcrumbs and return new breadcrumbs, the new breadcrumbs will looks like
   * Home > Search > Visualization
   * @param breadcrumbs existing breadcrumbs
   * @param currentNavGroup current nav group object
   * @param navigateToApp
   * @returns new breadcrumbs array
   */
  private prependCurrentNavGroupToBreadcrumbs(
    breadcrumbs: ChromeBreadcrumb[],
    currentNavGroup: NavGroupItemInMap,
    navigateToApp: ApplicationStart['navigateToApp']
  ) {
    const navGroupBreadcrumb: ChromeBreadcrumb = {
      text: currentNavGroup.title,
      onClick: () => {
        if (currentNavGroup.navLinks && currentNavGroup.navLinks.length) {
          navigateToApp(currentNavGroup.navLinks[0].id);
        }
      },
    };
    return [navGroupBreadcrumb, ...breadcrumbs];
  }

  async stop() {
    this.stop$.next();
    this.navGroupEnabledUiSettingsSubscription?.unsubscribe();
    this.currentAppIdSubscription?.unsubscribe();
    this.currentNavGroupSubscription?.unsubscribe();
  }
}

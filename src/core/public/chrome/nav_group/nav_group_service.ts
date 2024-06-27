/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { AppCategory, ChromeNavGroup } from 'opensearch-dashboards/public';

/** @public */
export interface ChromeRegistrationNavLink {
  id: string;
  title?: string;
  category?: AppCategory;
  order?: number;
}

export type NavGroupItemInMap = ChromeNavGroup & {
  navLinks: ChromeRegistrationNavLink[];
};

export interface ChromeNavGroupServiceSetupContract {
  addNavLinksToGroup: (navGroup: ChromeNavGroup, navLinks: ChromeRegistrationNavLink[]) => void;
  getNavGroupsMap$: () => Observable<Record<string, NavGroupItemInMap>>;
}

export interface ChromeNavGroupServiceStartContract {
  getNavGroupsMap$: () => Observable<Record<string, NavGroupItemInMap>>;
}

/** @internal */
export class ChromeNavGroupService {
  private readonly navGroupsMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>({});
  private addNavLinkToGroup(
    currentGroupsMap: Record<string, NavGroupItemInMap>,
    navGroup: ChromeNavGroup,
    navLink: ChromeRegistrationNavLink
  ) {
    const matchedGroup = currentGroupsMap[navGroup.id];
    if (matchedGroup) {
      const links = matchedGroup.navLinks;
      const isLinkExistInGroup = !!links.find((link) => link.id === navLink.id);
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
  setup(): ChromeNavGroupServiceSetupContract {
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
      getNavGroupsMap$: () => this.navGroupsMap$.pipe(),
    };
  }
  async start(): Promise<ChromeNavGroupServiceStartContract> {
    return {
      getNavGroupsMap$: () => this.navGroupsMap$.pipe(),
    };
  }
}

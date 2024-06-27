/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppCategory } from 'opensearch-dashboards/public';
import { groupBy, sortBy } from 'lodash';
import { ChromeNavLink } from './nav_links';
import { ChromeRegistrationNavLink } from './nav_group';

const LinkItemType = {
  LINK: 'link',
  CATEGORY: 'category',
} as const;

export type LinkItem = { order?: number } & (
  | { itemType: 'link'; link: ChromeNavLink }
  | { itemType: 'category'; category?: AppCategory; links?: ChromeNavLink[] }
);

function getAllCategories(allCategorizedLinks: Record<string, ChromeNavLink[]>) {
  const allCategories = {} as Record<string, AppCategory | undefined>;

  for (const [key, value] of Object.entries(allCategorizedLinks)) {
    allCategories[key] = value[0].category;
  }

  return allCategories;
}

export function fullfillRegistrationLinksToChromeNavLinks(
  registerNavLinks: ChromeRegistrationNavLink[],
  navLinks: ChromeNavLink[]
): Array<ChromeNavLink & { order?: number }> {
  const allExistingNavLinkId = navLinks.map((link) => link.id);
  return (
    registerNavLinks
      ?.filter((navLink) => allExistingNavLinkId.includes(navLink.id))
      .map((navLink) => ({
        ...navLinks[allExistingNavLinkId.indexOf(navLink.id)],
        ...navLink,
      })) || []
  );
}

export const getOrderedLinks = (navLinks: ChromeNavLink[]): ChromeNavLink[] =>
  sortBy(navLinks, (link) => link.order);

export function getOrderedLinksOrCategories(navLinks: ChromeNavLink[]): LinkItem[] {
  const groupedNavLinks = groupBy(navLinks, (link) => link?.category?.id);
  const { undefined: unknowns = [], ...allCategorizedLinks } = groupedNavLinks;
  const categoryDictionary = getAllCategories(allCategorizedLinks);
  return sortBy(
    [
      ...unknowns.map((linkWithoutCategory) => ({
        itemType: LinkItemType.LINK,
        link: linkWithoutCategory,
        order: linkWithoutCategory.order,
      })),
      ...Object.keys(allCategorizedLinks).map((categoryKey) => ({
        itemType: LinkItemType.CATEGORY,
        category: categoryDictionary[categoryKey],
        order: categoryDictionary[categoryKey]?.order,
        links: getOrderedLinks(allCategorizedLinks[categoryKey]),
      })),
    ],
    (item) => item.order
  );
}

export function flattenLinksOrCategories(linkItems: LinkItem[]): ChromeNavLink[] {
  return linkItems.reduce((acc, item) => {
    if (item.itemType === LinkItemType.LINK) {
      acc.push(item.link);
    } else if (item.itemType === LinkItemType.CATEGORY) {
      acc.push(...(item.links || []));
    }

    return acc;
  }, [] as ChromeNavLink[]);
}

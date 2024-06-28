/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppCategory } from 'opensearch-dashboards/public';
import { groupBy, sortBy } from 'lodash';
import { ChromeNavLink } from './nav_links';
import { ChromeRegistrationNavLink } from './nav_group';

export const LinkItemType = {
  LINK: 'link',
  CATEGORY: 'category',
  PARENT_LINK: 'parentLink',
} as const;

export type LinkItem = { order?: number } & (
  | { itemType: 'link'; link: ChromeNavLink & ChromeRegistrationNavLink }
  | { itemType: 'parentLink'; link?: ChromeNavLink & ChromeRegistrationNavLink; links: LinkItem[] }
  | { itemType: 'category'; category?: AppCategory; links?: LinkItem[] }
);

export function getAllCategories(allCategorizedLinks: Record<string, ChromeNavLink[]>) {
  const allCategories = {} as Record<string, AppCategory | undefined>;

  for (const [key, value] of Object.entries(allCategorizedLinks)) {
    allCategories[key] = value[0].category;
  }

  return allCategories;
}

export function fulfillRegistrationLinksToChromeNavLinks(
  registerNavLinks: ChromeRegistrationNavLink[],
  navLinks: ChromeNavLink[]
): Array<ChromeNavLink & ChromeRegistrationNavLink> {
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

export function flattenLinksOrCategories(linkItems: LinkItem[]): ChromeNavLink[] {
  return linkItems.reduce((acc, item) => {
    if (item.itemType === LinkItemType.LINK) {
      acc.push(item.link);
    } else if (item.itemType === LinkItemType.PARENT_LINK) {
      if (item.link) {
        acc.push(item.link);
      }
      acc.push(...flattenLinksOrCategories(item.links));
    } else if (item.itemType === LinkItemType.CATEGORY) {
      acc.push(...flattenLinksOrCategories(item.links || []));
    }

    return acc;
  }, [] as ChromeNavLink[]);
}

export const generateItemTypeByLink = (
  navLink: ChromeNavLink & ChromeRegistrationNavLink,
  navLinksGoupedByParentNavLink: Record<string, ChromeNavLink[]>
): LinkItem => {
  const navLinksUnderParentId = navLinksGoupedByParentNavLink[navLink.id];

  if (navLinksUnderParentId) {
    return {
      itemType: LinkItemType.PARENT_LINK,
      link: navLink,
      links: getOrderedLinks(navLinksUnderParentId || []).map((navLinkUnderParentId) =>
        generateItemTypeByLink(navLinkUnderParentId, navLinksGoupedByParentNavLink)
      ),
      order: navLink?.order,
    };
  } else {
    return {
      itemType: LinkItemType.LINK,
      link: navLink,
      order: navLink.order,
    };
  }
};

/**
 * This function accept navLinks and gives a grouped result for category / parent nav link
 * @param navLinks
 * @returns LinkItem[]
 */
export function getOrderedLinksOrCategories(
  navLinks: Array<ChromeNavLink & ChromeRegistrationNavLink>
): LinkItem[] {
  // Get the nav links group by parent nav link
  const allNavLinksWithParentNavLink = navLinks.filter((navLink) => navLink.parentNavLinkId);
  const navLinksGoupedByParentNavLink = groupBy(
    allNavLinksWithParentNavLink,
    (navLink) => navLink.parentNavLinkId
  );

  // Group all the nav links without parentNavLinkId
  const groupedNavLinks = groupBy(
    navLinks.filter((item) => !item.parentNavLinkId),
    (link) => link?.category?.id
  );
  const { undefined: unknowns = [], ...allCategorizedLinks } = groupedNavLinks;
  const categoryDictionary = getAllCategories(allCategorizedLinks);

  // Get all the parent nav ids that defined by nested items but can not find matched parent nav in navLinks
  const unusedParentNavLinks = Object.keys(navLinksGoupedByParentNavLink).filter(
    (navLinkId) => !navLinks.find((navLink) => navLink.id === navLinkId)
  );

  const result = [
    // Nav links without category, the order is determined by link itself
    ...unknowns.map((linkWithoutCategory) =>
      generateItemTypeByLink(linkWithoutCategory, navLinksGoupedByParentNavLink)
    ),
    // Nav links with category, the order is determined by category order
    ...Object.keys(allCategorizedLinks).map((categoryKey) => {
      return {
        itemType: LinkItemType.CATEGORY,
        category: categoryDictionary[categoryKey],
        order: categoryDictionary[categoryKey]?.order,
        links: getOrderedLinks(allCategorizedLinks[categoryKey]).map((navLink) =>
          generateItemTypeByLink(navLink, navLinksGoupedByParentNavLink)
        ),
      };
    }),
    // Nav links that should have belong to a parent nav id
    // but not find matched parent nav in navLinks
    // should be treated as normal link
    ...unusedParentNavLinks.reduce((total, groupId) => {
      return [
        ...total,
        ...navLinksGoupedByParentNavLink[groupId].map((navLink) =>
          generateItemTypeByLink(navLink, navLinksGoupedByParentNavLink)
        ),
      ];
    }, [] as LinkItem[]),
  ];

  return sortBy(result, (item) => item.order);
}

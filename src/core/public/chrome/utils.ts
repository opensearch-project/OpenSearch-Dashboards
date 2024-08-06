/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppCategory } from 'opensearch-dashboards/public';
import { ChromeNavLink } from './nav_links';
import { ChromeRegistrationNavLink } from './nav_group';

type KeyOf<T> = keyof T;

const sortBy = <T>(key: KeyOf<T>) => {
  return (a: T, b: T): number => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0);
};

const groupBy = <T>(array: T[], getKey: (item: T) => string | undefined): Record<string, T[]> => {
  return array.reduce((result, currentValue) => {
    const groupKey = String(getKey(currentValue));
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentValue);
    return result;
  }, {} as Record<string, T[]>);
};

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

export function getAllCategories(
  allCategorizedLinks: Record<string, Array<ChromeNavLink & ChromeRegistrationNavLink>>
) {
  const allCategories = {} as Record<string, AppCategory | undefined>;

  for (const [key, value] of Object.entries(allCategorizedLinks)) {
    allCategories[key] = value[0].category;
  }

  return allCategories;
}

/**
 * This function accept an array of ChromeRegistrationNavLink and an array of ChromeNavLink
 * return an fulfilled array of items which are the merged result of the registerNavLinks and navLinks.
 * @param registerNavLinks ChromeRegistrationNavLink[]
 * @param navLinks ChromeNavLink[]
 * @returns Array<ChromeNavLink & ChromeRegistrationNavLink>
 */
export function fulfillRegistrationLinksToChromeNavLinks(
  registerNavLinks: ChromeRegistrationNavLink[],
  navLinks: ChromeNavLink[]
): Array<ChromeNavLink & ChromeRegistrationNavLink> {
  const allExistingNavLinkId = navLinks.map((link) => link.id);
  return (
    registerNavLinks
      .filter((navLink) => allExistingNavLinkId.includes(navLink.id))
      .map((navLink) => ({
        ...navLinks[allExistingNavLinkId.indexOf(navLink.id)],
        ...navLink,
      })) || []
  );
}

export const getOrderedLinks = (navLinks: ChromeNavLink[]): ChromeNavLink[] =>
  navLinks.sort(sortBy('order'));

function walkLinkItemsTree(
  props: {
    linkItems: LinkItem[];
    parentItem?: LinkItem;
  },
  cb: (props: { currentItem: LinkItem; parentItem?: LinkItem }) => void
) {
  props.linkItems.forEach((item) => {
    cb?.({
      parentItem: props.parentItem,
      currentItem: item,
    });
    if (item.itemType === LinkItemType.PARENT_LINK) {
      walkLinkItemsTree(
        {
          linkItems: item.links,
          parentItem: item,
        },
        cb
      );
    } else if (item.itemType === LinkItemType.CATEGORY) {
      walkLinkItemsTree(
        {
          linkItems: item.links || [],
          parentItem: item,
        },
        cb
      );
    }
  });
}

export const generateItemTypeByLink = (
  navLink: ChromeNavLink & ChromeRegistrationNavLink,
  navLinksGroupedByParentNavLink: Record<string, ChromeNavLink[]>
): LinkItem => {
  const navLinksUnderParentId = navLinksGroupedByParentNavLink[navLink.id];

  if (navLinksUnderParentId) {
    return {
      itemType: LinkItemType.PARENT_LINK,
      link: navLink,
      links: getOrderedLinks(navLinksUnderParentId || []).map((navLinkUnderParentId) =>
        generateItemTypeByLink(navLinkUnderParentId, navLinksGroupedByParentNavLink)
      ),
      order: navLink.order,
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
  const navLinksGroupedByParentNavLink = groupBy(
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
  const unusedParentNavLinks = Object.keys(navLinksGroupedByParentNavLink).filter(
    (navLinkId) => !navLinks.find((navLink) => navLink.id === navLinkId)
  );

  const result = [
    // Nav links without category, the order is determined by link itself
    ...unknowns.map((linkWithoutCategory) =>
      generateItemTypeByLink(linkWithoutCategory, navLinksGroupedByParentNavLink)
    ),
    // Nav links with category, the order is determined by category order
    ...Object.keys(allCategorizedLinks).map((categoryKey) => {
      return {
        itemType: LinkItemType.CATEGORY,
        category: categoryDictionary[categoryKey],
        order: categoryDictionary[categoryKey]?.order,
        links: getOrderedLinks(allCategorizedLinks[categoryKey]).map((navLink) =>
          generateItemTypeByLink(navLink, navLinksGroupedByParentNavLink)
        ),
      };
    }),
    // Nav links that should have belong to a parent nav id
    // but not find matched parent nav in navLinks
    // should be treated as normal link
    ...unusedParentNavLinks.reduce((total, groupId) => {
      return [
        ...total,
        ...navLinksGroupedByParentNavLink[groupId].map((navLink) =>
          generateItemTypeByLink(navLink, navLinksGroupedByParentNavLink)
        ),
      ];
    }, [] as LinkItem[]),
  ];

  return result.sort(sortBy('order'));
}

export const getSortedNavLinks = (
  navLinks: ChromeNavLink[],
  enricher?: (currentItem: LinkItem, parentItem?: LinkItem) => LinkItem
) => {
  const sortedNavLinksTree = getOrderedLinksOrCategories(navLinks);
  const acc: ChromeNavLink[] = [];
  walkLinkItemsTree(
    {
      linkItems: sortedNavLinksTree,
    },
    (props) => {
      const { currentItem, parentItem } = props;
      const enricheredResult = enricher ? enricher(currentItem, parentItem) : currentItem;
      if (enricheredResult.itemType === LinkItemType.LINK) {
        acc.push(enricheredResult.link);
      } else if (enricheredResult.itemType === LinkItemType.PARENT_LINK) {
        if (enricheredResult.link) {
          acc.push(enricheredResult.link);
        }
      }
    }
  );
  return acc;
};

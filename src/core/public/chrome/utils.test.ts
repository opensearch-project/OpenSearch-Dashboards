/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChromeRegistrationNavLink } from './nav_group';
import { ChromeNavLink } from './nav_links';
import {
  getAllCategories,
  fulfillRegistrationLinksToChromeNavLinks,
  getOrderedLinks,
  getOrderedLinksOrCategories,
  getSortedNavLinks,
  searchNavigationLinks,
} from './utils';

const mockedNonCategoryLink = {
  id: 'no-category',
  title: 'no-category',
  baseUrl: '',
  href: '',
  order: 6,
};

const mockedNavLinkA = {
  id: 'a',
  title: 'a',
  baseUrl: '',
  href: '',
  category: {
    id: 'a',
    label: 'a',
    order: 10,
  },
  order: 10,
};

const mockedNavLinkB = {
  id: 'b',
  title: 'b',
  baseUrl: '',
  href: '',
  category: {
    id: 'b',
    label: 'b',
    order: 5,
  },
  order: 5,
};

const mockedSubNavLinkA = {
  id: 'sub_a',
  parentNavLinkId: 'a',
  title: 'sub_a',
  baseUrl: '',
  href: '',
  order: 10,
};

describe('getAllCategories', () => {
  it('should return all categories', () => {
    const links = {
      a: [mockedNavLinkA],
      b: [mockedNavLinkB],
    };
    const categories = getAllCategories(links);
    expect(categories).toEqual({
      a: {
        id: 'a',
        label: 'a',
        order: 10,
      },
      b: {
        id: 'b',
        label: 'b',
        order: 5,
      },
    });
  });
});

describe('fulfillRegistrationLinksToChromeNavLinks', () => {
  it('should return fullfilled ChromeNavLink', () => {
    const registrationNavLinks: ChromeRegistrationNavLink[] = [
      {
        id: 'a',
        title: 'a',
        category: {
          id: 'a',
          label: 'a',
          order: 10,
        },
      },
      {
        id: 'b',
      },
    ];
    const navLinks: ChromeNavLink[] = [mockedNavLinkA, mockedNavLinkB];
    const fulfilledResult = fulfillRegistrationLinksToChromeNavLinks(
      registrationNavLinks,
      navLinks
    );
    expect(fulfilledResult).toEqual([mockedNavLinkA, mockedNavLinkB]);
  });
});

describe('getOrderedLinks', () => {
  it('should return ordered links', () => {
    const navLinks = [mockedNavLinkA, mockedNavLinkB];
    const orderedLinks = getOrderedLinks(navLinks);
    expect(orderedLinks).toEqual([mockedNavLinkB, mockedNavLinkA]);
  });
});

describe('getOrderedLinksOrCategories', () => {
  it('should return ordered links', () => {
    const navLinks = [mockedNonCategoryLink, mockedNavLinkA, mockedNavLinkB];
    const orderedLinks = getOrderedLinksOrCategories(navLinks);
    expect(orderedLinks[0]).toEqual(
      expect.objectContaining({
        category: mockedNavLinkB.category,
      })
    );
    expect(orderedLinks[1]).toEqual(
      expect.objectContaining({
        link: mockedNonCategoryLink,
      })
    );
    expect(orderedLinks[2]).toEqual(
      expect.objectContaining({
        category: mockedNavLinkA.category,
      })
    );
  });
});

describe('getSortedNavLinks', () => {
  it('should return flattened links', () => {
    const navLinks = [mockedNonCategoryLink, mockedNavLinkA, mockedNavLinkB, mockedSubNavLinkA];
    const sortedNavLinks = getSortedNavLinks(navLinks);
    expect(sortedNavLinks.map((item) => item.id)).toEqual([
      mockedNavLinkB.id,
      mockedNonCategoryLink.id,
      mockedNavLinkA.id,
      mockedSubNavLinkA.id,
    ]);
  });
});

describe('searchNavigationLinks', () => {
  const mockedNavLinkParent = {
    id: 'parent',
    title: 'Parent Link',
    baseUrl: '',
    href: '',
    order: 1,
  };

  const mockedNavLinkChild = {
    id: 'child',
    parentNavLinkId: 'parent',
    title: 'Child Link',
    baseUrl: '',
    href: '',
    order: 2,
  };

  const mockedHiddenLink = {
    id: 'hidden',
    title: 'Hidden Link',
    baseUrl: '',
    href: '',
    hidden: true,
    order: 3,
  };

  const mockedDisabledLink = {
    id: 'disabled',
    title: 'Disabled Link',
    baseUrl: '',
    href: '',
    disabled: true,
    order: 4,
  };

  const mockedNavGroup = {
    id: 'test-group',
    title: 'Test Group',
    description: 'Test Group',
    navLinks: [mockedNavLinkParent, mockedNavLinkChild, mockedHiddenLink, mockedDisabledLink],
  };

  const navGroupMap = {
    'test-group': mockedNavGroup,
  };

  const allAvailableCaseId = ['test-group'];

  it('should return matching visible and enabled links', () => {
    const query = 'child';
    const result = searchNavigationLinks(allAvailableCaseId, navGroupMap, query);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'child',
        title: 'Child Link',
        navGroup: mockedNavGroup,
      })
    );
  });

  it('should return child links when searching by parent title', () => {
    const query = 'parent';
    const result = searchNavigationLinks(allAvailableCaseId, navGroupMap, query);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'child',
        title: 'Child Link',
        navGroup: mockedNavGroup,
      })
    );
  });

  it('should not return hidden links', () => {
    const query = 'hidden';
    const result = searchNavigationLinks(allAvailableCaseId, navGroupMap, query);

    expect(result).toHaveLength(0);
  });

  it('should not return disabled links', () => {
    const query = 'disabled';
    const result = searchNavigationLinks(allAvailableCaseId, navGroupMap, query);

    expect(result).toHaveLength(0);
  });

  it('should not return parent links', () => {
    const query = 'Parent';
    const result = searchNavigationLinks(allAvailableCaseId, navGroupMap, query);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'child',
        title: 'Child Link',
      })
    );
  });

  it('should handle case-insensitive search', () => {
    const query = 'CHILD';
    const result = searchNavigationLinks(allAvailableCaseId, navGroupMap, query);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'child',
        title: 'Child Link',
      })
    );
  });

  it('should handle non-existent nav group', () => {
    const result = searchNavigationLinks(['non-existent'], navGroupMap, 'test');

    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty query', () => {
    const query = '';
    const result = searchNavigationLinks(allAvailableCaseId, navGroupMap, query);

    expect(result).toHaveLength(1);
  });
});

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
    const navLinks = [mockedNonCategoryLink, mockedNavLinkA, mockedNavLinkB];
    const flattenedLinks = getSortedNavLinks(navLinks);
    expect(flattenedLinks.map((item) => item.id)).toEqual([
      mockedNavLinkB.id,
      mockedNonCategoryLink.id,
      mockedNavLinkA.id,
    ]);
  });
});

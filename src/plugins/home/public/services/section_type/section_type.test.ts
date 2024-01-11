/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SectionTypeService } from './section_type';
import { coreMock } from '../../../../../core/public/mocks';
import { dataPluginMock } from '../../../../data/public/mocks';

describe('SectionTypeService', () => {
  describe('setup', () => {
    test('supports registering hero sections', () => {
      const setup = new SectionTypeService().setup();
      expect(() => {
        setup.registerHeroSection({
          id: 'foo',
          render: () => () => {},
        });
        setup.registerHeroSection({
          id: 'bar',
          render: () => () => {},
        });
      }).not.toThrow();
    });

    test('throws if registering hero section with same id', () => {
      const setup = new SectionTypeService().setup();
      expect(() => {
        setup.registerHeroSection({
          id: 'foo',
          render: () => () => {},
        });
        setup.registerHeroSection({
          id: 'foo',
          render: () => () => {},
        });
      }).toThrowErrorMatchingInlineSnapshot(`"Hero section with id 'foo' already exists."`);
    });

    test('supports registering sections', () => {
      const setup = new SectionTypeService().setup();
      expect(() => {
        setup.registerSection({
          id: 'foo',
          title: 'Foo',
          render: () => () => {},
        });
        setup.registerSection({
          id: 'bar',
          title: 'Bar',
          render: () => () => {},
        });
      }).not.toThrow();
    });

    test('throws if registering section with same id', () => {
      const setup = new SectionTypeService().setup();
      expect(() => {
        setup.registerSection({
          id: 'foo',
          title: 'Foo',
          render: () => () => {},
        });
        setup.registerSection({
          id: 'foo',
          title: 'Foo',
          render: () => () => {},
        });
      }).toThrowErrorMatchingInlineSnapshot(`"Section with id 'foo' already exists."`);
    });
  });

  describe('start', () => {
    test('initializes savedHomepageLoader', () => {
      const core = coreMock.createStart();
      const data = dataPluginMock.createStartContract();

      const sectionTypeService = new SectionTypeService();
      sectionTypeService.start({ core, data });

      expect(sectionTypeService.getSavedHomepageLoader()).toBeDefined();
    });
  });

  describe('getHomepage', () => {
    test('throws if start not called', async () => {
      const sectionTypeService = new SectionTypeService();
      await expect(sectionTypeService.getHomepage()).rejects.toThrowErrorMatchingInlineSnapshot(
        `"SectionTypeService has not been started yet."`
      );
    });

    test('returns empty homepage if no sections registered', async () => {
      const core = coreMock.createStart();
      const data = dataPluginMock.createStartContract();

      core.savedObjects.client.find = jest
        .fn()
        .mockResolvedValue(Promise.resolve({ savedObjects: [], totoal: 0 }));

      core.savedObjects.client.create = jest.fn().mockResolvedValue(Promise.resolve({ id: '1' }));

      const sectionTypeService = new SectionTypeService();
      sectionTypeService.start({ core, data });

      const homepage = sectionTypeService.getHomepage();
      await expect(homepage).resolves.toEqual({ heroes: [], sections: [] });
    });

    test('returns homepage with registered sections', async () => {
      const core = coreMock.createStart();
      const data = dataPluginMock.createStartContract();

      const savedHomepage = {
        id: '1',
        attributes: {
          heros: [],
          sections: [{ id: 'foo' }, { id: 'bar' }],
        },
      };

      core.savedObjects.client.find = jest.fn().mockResolvedValue(
        Promise.resolve({
          savedObjects: [savedHomepage],
          total: 1,
        })
      );

      core.savedObjects.client.create = jest.fn().mockResolvedValue(Promise.resolve({ id: '1' }));

      core.savedObjects.client.get = jest
        .fn()
        .mockResolvedValue(Promise.resolve({ ...savedHomepage, _version: 1 }));

      const sectionTypeService = new SectionTypeService();
      const setup = sectionTypeService.setup();

      setup.registerSection({
        id: 'foo',
        title: 'Foo',
        render: () => () => {},
      });
      setup.registerSection({
        id: 'bar',
        title: 'Bar',
        render: () => () => {},
      });

      sectionTypeService.start({ core, data });

      const homepage = sectionTypeService.getHomepage();
      await expect(homepage).resolves.toEqual({
        heroes: [],
        sections: [
          { id: 'foo', title: 'Foo', render: expect.any(Function) },
          { id: 'bar', title: 'Bar', render: expect.any(Function) },
        ],
      });
    });

    test('returns homepage with multiple existing homepages', async () => {
      const core = coreMock.createStart();
      const data = dataPluginMock.createStartContract();

      const savedHomepage = {
        id: '1',
        attributes: {
          heros: [],
          sections: [{ id: 'foo' }, { id: 'bar' }],
        },
      };

      core.savedObjects.client.find = jest.fn().mockResolvedValue(
        Promise.resolve({
          savedObjects: [savedHomepage, { id: '2', attributes: { heros: [], sections: [] } }],
          total: 2,
        })
      );

      core.savedObjects.client.create = jest.fn().mockResolvedValue(Promise.resolve({ id: '1' }));

      core.savedObjects.client.get = jest
        .fn()
        .mockResolvedValue(Promise.resolve({ ...savedHomepage, _version: 1 }));

      const sectionTypeService = new SectionTypeService();
      const setup = sectionTypeService.setup();

      setup.registerSection({
        id: 'foo',
        title: 'Foo',
        render: () => () => {},
      });
      setup.registerSection({
        id: 'bar',
        title: 'Bar',
        render: () => () => {},
      });

      sectionTypeService.start({ core, data });

      const homepage = sectionTypeService.getHomepage();
      await expect(homepage).resolves.toEqual({
        heroes: [],
        sections: [
          { id: 'foo', title: 'Foo', render: expect.any(Function) },
          { id: 'bar', title: 'Bar', render: expect.any(Function) },
        ],
      });
    });

    test('filters out sections that are no longer registered', async () => {
      const core = coreMock.createStart();
      const data = dataPluginMock.createStartContract();

      const savedHomepage = {
        id: '1',
        attributes: {
          heros: [],
          sections: [{ id: 'foo' }, { id: 'bar' }],
        },
      };

      core.savedObjects.client.find = jest.fn().mockResolvedValue(
        Promise.resolve({
          savedObjects: [savedHomepage],
          total: 1,
        })
      );

      core.savedObjects.client.create = jest.fn().mockResolvedValue(Promise.resolve({ id: '1' }));

      core.savedObjects.client.get = jest
        .fn()
        .mockResolvedValue(Promise.resolve({ ...savedHomepage, _version: 1 }));

      const sectionTypeService = new SectionTypeService();
      const setup = sectionTypeService.setup();

      setup.registerSection({
        id: 'foo',
        title: 'Foo',
        render: () => () => {},
      });

      sectionTypeService.start({ core, data });

      const homepage = sectionTypeService.getHomepage();
      await expect(homepage).resolves.toEqual({
        heroes: [],
        sections: [{ id: 'foo', title: 'Foo', render: expect.any(Function) }],
      });
    });
  });

  describe('getHeroSectionTypes', () => {
    test('returns empty array if no hero sections registered', () => {
      const sectionTypeService = new SectionTypeService();
      expect(sectionTypeService.getHeroSectionTypes()).toEqual([]);
    });

    test('returns registered hero sections', () => {
      const sectionTypeService = new SectionTypeService();
      const setup = sectionTypeService.setup();

      setup.registerHeroSection({
        id: 'foo',
        render: () => () => {},
      });

      setup.registerHeroSection({
        id: 'bar',
        render: () => () => {},
      });

      expect(sectionTypeService.getHeroSectionTypes()).toEqual([
        { id: 'foo', render: expect.any(Function) },
        { id: 'bar', render: expect.any(Function) },
      ]);
    });
  });

  describe('getSectionTypes', () => {
    test('returns empty array if no sections registered', () => {
      const sectionTypeService = new SectionTypeService();
      expect(sectionTypeService.getSectionTypes()).toEqual([]);
    });

    test('returns registered sections', () => {
      const sectionTypeService = new SectionTypeService();
      const setup = sectionTypeService.setup();

      setup.registerSection({
        id: 'foo',
        title: 'Foo',
        render: () => () => {},
      });

      setup.registerSection({
        id: 'bar',
        title: 'Bar',
        render: () => () => {},
      });

      expect(sectionTypeService.getSectionTypes()).toEqual([
        { id: 'foo', title: 'Foo', render: expect.any(Function) },
        { id: 'bar', title: 'Bar', render: expect.any(Function) },
      ]);
    });
  });

  describe('getSavedHomepageLoader', () => {
    test('throws if start not called', () => {
      const sectionTypeService = new SectionTypeService();
      expect(() => sectionTypeService.getSavedHomepageLoader()).toThrowErrorMatchingInlineSnapshot(
        `"SectionTypeService has not been started yet."`
      );
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { SectionTypeService } from './section_type';
import { coreMock } from '../../../../../core/public/mocks';
import { dataPluginMock } from '../../../../data/public/mocks';

function expectObservable<T>(observable: Observable<T>) {
  expect(observable).toBeDefined();
  expect(observable).toBeInstanceOf(Observable);

  return expect(
    observable
      .pipe(
        filter((val) => val !== undefined),
        first()
      )
      .toPromise()
  ).resolves;
}

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
      expect(() => sectionTypeService.getHomepage()).toThrowErrorMatchingInlineSnapshot(
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
      expect(homepage).toBeDefined();

      await expectObservable(homepage.heroes$).toEqual([]);
      await expectObservable(homepage.sections$).toEqual([]);

      homepage.cleanup();
    });

    test('returns homepage with registered sections', async () => {
      const core = coreMock.createStart();
      const data = dataPluginMock.createStartContract();

      const savedHomepage = {
        id: '1',
        attributes: {
          heroes: [],
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

      await expectObservable(homepage.heroes$).toEqual([]);
      await expectObservable(homepage.sections$).toEqual([
        { id: 'foo', title: 'Foo', render: expect.any(Function) },
        { id: 'bar', title: 'Bar', render: expect.any(Function) },
      ]);

      homepage.cleanup();
    });

    test('filters out sections that are no longer registered', async () => {
      const core = coreMock.createStart();
      const data = dataPluginMock.createStartContract();

      const savedHomepage = {
        id: '1',
        attributes: {
          heroes: [],
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
      await expectObservable(homepage.heroes$).toEqual([]);
      await expectObservable(homepage.sections$).toEqual([
        { id: 'foo', title: 'Foo', render: expect.any(Function) },
      ]);

      homepage.cleanup();
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

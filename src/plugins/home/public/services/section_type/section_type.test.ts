/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SectionTypeService } from './section_type';

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

  describe('getHeroSectionTypes', () => {
    test('returns empty array if no hero sections registered', () => {
      const sectionTypeService = new SectionTypeService();
      expect(sectionTypeService.getHeroSectionTypes()).toEqual([]);
    });

    test('returns registered hero sections', () => {
      const sectionTypeService = new SectionTypeService();

      sectionTypeService.setup().registerHeroSection({
        id: 'foo',
        render: () => () => {},
      });
      sectionTypeService.setup().registerHeroSection({
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

      sectionTypeService.setup().registerSection({
        id: 'foo',
        title: 'Foo',
        render: () => () => {},
      });
      sectionTypeService.setup().registerSection({
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
});

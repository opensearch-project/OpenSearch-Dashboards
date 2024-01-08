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
  });
});

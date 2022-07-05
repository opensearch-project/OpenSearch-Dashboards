/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationTypeOptions } from './types';
import { TypeService } from './type_service';

const DEFAULT_VIZ_PROPS: VisualizationTypeOptions = {
  name: 'some-name',
  icon: 'some-icon',
  title: 'Some Title',
  ui: {} as any, // Not required for this test
  toExpression: async (state) => {
    return 'test';
  },
};

describe('TypeService', () => {
  const createVizType = (props?: Partial<VisualizationTypeOptions>): VisualizationTypeOptions => {
    return {
      ...DEFAULT_VIZ_PROPS,
      ...props,
    };
  };

  let service: TypeService;

  beforeEach(() => {
    service = new TypeService();
  });

  describe('#setup', () => {
    test('should throw an error if two visualizations of the same id are registered', () => {
      const { createVisualizationType } = service.setup();

      createVisualizationType(createVizType({ name: 'viz-type-1' }));

      expect(() => {
        createVisualizationType(createVizType({ name: 'viz-type-1' }));
      }).toThrowErrorMatchingInlineSnapshot(
        `"A visualization with this the name viz-type-1 already exists!"`
      );
    });
  });

  describe('#start', () => {
    test('should return registered visualization if it exists', () => {
      const { createVisualizationType } = service.setup();
      createVisualizationType(createVizType({ name: 'viz-type-1' }));

      const { get } = service.start();
      expect(get('viz-type-1')).toEqual(expect.objectContaining({ name: 'viz-type-1' }));
      expect(get('viz-type-no-exists')).toBeUndefined();
    });

    test('should return all registered visualizations', () => {
      const { createVisualizationType } = service.setup();
      createVisualizationType(createVizType({ name: 'viz-type-1' }));
      createVisualizationType(createVizType({ name: 'viz-type-2' }));

      const { all } = service.start();
      const allRegisteredVisualizations = all();
      expect(allRegisteredVisualizations.map(({ name }) => name)).toEqual([
        'viz-type-1',
        'viz-type-2',
      ]);
    });
  });
});

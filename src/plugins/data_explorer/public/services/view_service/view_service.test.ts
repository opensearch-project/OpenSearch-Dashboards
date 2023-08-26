/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViewDefinition } from './types';
import { ViewService } from './view_service';

const DEFAULT_VIEW: ViewDefinition = {
  id: 'my-view',
  title: 'My view',
  defaultPath: '/my-view',
  appExtentions: {} as any, // Not required for this test
  ui: {} as any, // Not required for this test
};

describe('TypeService', () => {
  const createViewDefinition = (props?: Partial<ViewDefinition>): ViewDefinition => {
    return {
      ...DEFAULT_VIEW,
      ...props,
    };
  };

  let service: ViewService;

  beforeEach(() => {
    service = new ViewService();
  });

  describe('#setup', () => {
    test('should throw an error if two visualizations of the same id are registered', () => {
      const { registerView } = service.setup();

      registerView(createViewDefinition({ id: 'view-1' }));

      expect(() => {
        registerView(createViewDefinition({ id: 'view-1' }));
      }).toThrowErrorMatchingInlineSnapshot(`"A view with the id view-1 already exists!"`);
    });
  });

  describe('#start', () => {
    test('should return registered view if it exists', () => {
      const { registerView } = service.setup();
      registerView(createViewDefinition({ id: 'view-1' }));

      const { get } = service.start();
      expect(get('view-1')).toEqual(expect.objectContaining({ id: 'view-1' }));
      expect(get('view-something')).toBeUndefined();
    });

    test('should return all registered views', () => {
      const { registerView } = service.setup();
      registerView(createViewDefinition({ id: 'view-1' }));
      registerView(createViewDefinition({ id: 'view-2' }));

      const { all } = service.start();
      const allRegisteredViews = all();
      expect(allRegisteredViews.map(({ id }) => id)).toEqual(['view-1', 'view-2']);
    });
  });
});

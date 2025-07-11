/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { VisualizationContainer } from './visualization_container';

// Mock all dependencies to avoid import chain issues
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: {
        query: {
          queryString: { getQuery: () => ({}) },
          filterManager: { getFilters: () => [] },
          timefilter: { timefilter: { getTime: () => ({}) } },
          state$: { subscribe: () => ({ unsubscribe: () => {} }) },
        },
      },
      expressions: { ReactExpressionRenderer: () => null },
      notifications: { toasts: { addInfo: jest.fn() } },
    },
  }),
  withOpenSearchDashboards: (component: any) => component,
}));

jest.mock('react-redux', () => ({
  useSelector: () => ({}),
  useDispatch: () => jest.fn(),
  connect: () => (component: any) => component,
}));

jest.mock('../../application/components/index_pattern_context', () => ({
  useIndexPatternContext: () => ({ indexPattern: {} }),
}));

jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: () => ({ results: { hits: { hits: [] } } }),
}));

jest.mock('./utils/use_visualization_types', () => ({
  useVisualizationRegistry: () => ({
    getVisualizationConfig: () => null,
    getRules: () => [],
  }),
}));

// Mock all other imports
jest.mock('./visualization', () => ({ Visualization: () => null }));
jest.mock('./add_to_dashboard_button', () => ({ SaveAndAddButtonWithModal: () => null }));
jest.mock('./visualization_container_utils', () => ({}));
jest.mock('./rule_repository', () => ({ ALL_VISUALIZATION_RULES: [] }));

describe('VisualizationContainer', () => {
  it('renders null when no visualization data', () => {
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });
});

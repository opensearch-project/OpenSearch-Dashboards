/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';

import * as VB from '../../../../../components/visualizations/visualization_builder';
import * as ReactUse from 'react-use';
import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';
import { useTabError } from '../../../../utils/hooks/use_tab_error';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';

// Mock react-redux before importing any components
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => mockUseSelector(selector),
  useDispatch: () => jest.fn(),
}));

jest.mock('../../../../../components/tabs/tabs', () => ({
  ExploreTabs: () => <div data-test-subj="explore-tabs">Explore Tabs</div>,
}));

jest.mock('../../../../../components/visualizations/style_panel_render', () => ({
  StylePanelRender: () => <div data-test-subj="style-panel">Style Panel</div>,
}));

jest.mock('./metrics_alerts_panel', () => ({
  MetricsAlertsPanel: () => <div data-test-subj="metrics-alerts-panel">Metrics Alerts Panel</div>,
}));

jest.mock('../../../../utils/hooks/use_tab_error', () => ({
  useTabError: jest.fn(),
}));

jest.mock('../../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

const mockUseTabError = useTabError as jest.MockedFunction<typeof useTabError>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;

describe('<ResizableVisControlAndTabs />', () => {
  const mockApplications$ = new BehaviorSubject(
    new Map<string, unknown>([['monitors', { id: 'monitors' }]])
  );

  beforeEach(() => {
    mockUseSelector.mockClear();
    mockApplications$.next(
      new Map<string, unknown>([['monitors', { id: 'monitors' }]])
    );
    jest
      .spyOn(ReactUse, 'useObservable')
      .mockImplementation((observable: any, initialValue?: unknown) => {
        if (observable === mockApplications$) {
          return mockApplications$.getValue();
        }

        return initialValue ?? {};
      });
    jest.spyOn(VB, 'getVisualizationBuilder').mockReturnValue(new VB.VisualizationBuilder({}));
    mockUseTabError.mockReturnValue(null);
    mockUseOpenSearchDashboards.mockReturnValue({
      services: {
        core: {
          application: {
            applications$: mockApplications$,
          },
        },
        tabRegistry: {
          getTab: jest.fn().mockReturnValue({
            id: 'explore_visualization_tab',
            label: 'Visualization',
            component: () => <div>Visualization Component</div>,
            flavor: ['logs'],
          }),
        },
      },
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should NOT display StylePanel if the current active tab is not visualization', () => {
    mockUseSelector.mockReturnValue('logs');
    render(<ResizableVisControlAndTabs />);
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('style-panel')).not.toBeInTheDocument();
  });

  test('it should display StylePanel if the current active tab is visualization', () => {
    mockUseSelector.mockReturnValue('explore_visualization_tab');
    render(<ResizableVisControlAndTabs />);
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('style-panel')).toBeInTheDocument();
  });

  test('it should NOT display StylePanel if the current active tab is visualization but no data', () => {
    mockUseSelector.mockReturnValue('explore_visualization_tab');
    jest.spyOn(ReactUse, 'useObservable').mockImplementation((observable: any) => {
      if (observable === mockApplications$) {
        return mockApplications$.getValue();
      }

      return undefined;
    });
    render(<ResizableVisControlAndTabs />);
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('style-panel')).not.toBeInTheDocument();
  });

  test('it should display only ExploreTabs when visualization tab has error', () => {
    mockUseSelector.mockReturnValue('explore_visualization_tab');
    mockUseTabError.mockReturnValue({
      statusCode: 400,
      error: 'Bad Request',
      message: {
        reason: 'Test error',
        details: 'Test error details',
        type: 'test_error',
      },
      originalErrorMessage: 'Original error message',
    });
    render(<ResizableVisControlAndTabs />);
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('style-panel')).not.toBeInTheDocument();
  });

  test('it should display Alerts panel when Alerts tab is selected', () => {
    mockUseSelector.mockReturnValue('explore_visualization_tab');
    render(<ResizableVisControlAndTabs />);

    fireEvent.click(screen.getByText('Alerts'));

    expect(screen.getByTestId('metrics-alerts-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('style-panel')).not.toBeInTheDocument();
  });

  test('it should hide Alerts tab when Alerting UI is unavailable', () => {
    mockUseSelector.mockReturnValue('explore_visualization_tab');
    mockApplications$.next(new Map());

    render(<ResizableVisControlAndTabs />);

    expect(screen.queryByText('Alerts')).not.toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import * as VB from '../../../visualizations/visualization_builder';
import * as ReactUse from 'react-use';
import * as ReactRedux from 'react-redux';
import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';

jest.mock('../../../tabs/tabs', () => ({
  ExploreTabs: () => <div data-test-subj="explore-tabs">Explore Tabs</div>,
}));

jest.mock('../../../visualizations/style_panel_render', () => ({
  StylePanelRender: () => <div data-test-subj="style-panel">Style Panel</div>,
}));

describe('<ResizableVisControlAndTabs />', () => {
  beforeEach(() => {
    jest.spyOn(ReactUse, 'useObservable').mockReturnValue({});
    jest.spyOn(VB, 'getVisualizationBuilder').mockReturnValue(new VB.VisualizationBuilder({}));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should NOT display StylePanel if the current active tab is not visualization', () => {
    jest.spyOn(ReactRedux, 'useSelector').mockReturnValue('logs');
    render(<ResizableVisControlAndTabs />);
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('style-panel')).not.toBeInTheDocument();
  });

  test('it should display StylePanel if the current active tab is visualization', () => {
    jest.spyOn(ReactRedux, 'useSelector').mockReturnValue('explore_visualization_tab');
    render(<ResizableVisControlAndTabs />);
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('style-panel')).toBeInTheDocument();
  });

  test('it should NOT display StylePanel if the current active tab is visualization but no data', () => {
    jest.spyOn(ReactRedux, 'useSelector').mockReturnValue('explore_visualization_tab');
    jest.spyOn(ReactUse, 'useObservable').mockReturnValue(undefined);
    render(<ResizableVisControlAndTabs />);
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
    expect(screen.queryByTestId('style-panel')).not.toBeInTheDocument();
  });
});

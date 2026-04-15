/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisActionBar } from './vis_action_bar';
import { BehaviorSubject } from 'rxjs';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';

jest.mock('../hooks/use_visualization_builder', () => ({ useVisualizationBuilder: jest.fn() }));
jest.mock('./save_vis_button', () => ({
  SaveVisButton: () => <div data-test-subj="save-vis-button" />,
}));
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));
const mockSetShowRawTable = jest.fn();

const buildVisualizationBuilder = (visConfig: any, showRawTable: boolean) => ({
  visualizationBuilderForEditor: {
    visConfig$: new BehaviorSubject(visConfig),
    showRawTable$: new BehaviorSubject(showRawTable),
    setShowRawTable: mockSetShowRawTable,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('VisActionBar', () => {
  it('renders the show raw data switch', () => {
    (useVisualizationBuilder as jest.Mock).mockReturnValue(
      buildVisualizationBuilder({ type: 'bar', axesMapping: { x: 'field' } }, false)
    );
    render(<VisActionBar />);
    expect(screen.getByTestId('exploreShowRawDataSwitch')).not.toBeDisabled();
  });

  it('renders SaveVisButton', () => {
    (useVisualizationBuilder as jest.Mock).mockReturnValue(buildVisualizationBuilder(null, false));
    render(<VisActionBar />);
    expect(screen.getByTestId('save-vis-button')).toBeInTheDocument();
  });

  it('disables show raw data switch when visConfig is null', () => {
    (useVisualizationBuilder as jest.Mock).mockReturnValue(buildVisualizationBuilder(null, false));
    render(<VisActionBar />);
    expect(screen.getByTestId('exploreShowRawDataSwitch')).toBeDisabled();
  });

  it('disables switch when chart type is table', () => {
    (useVisualizationBuilder as jest.Mock).mockReturnValue(
      buildVisualizationBuilder({ type: 'table', axesMapping: { x: 'field' } }, false)
    );
    render(<VisActionBar />);
    expect(screen.getByTestId('exploreShowRawDataSwitch')).toBeDisabled();
  });

  it('disables switch when axesMapping is empty', () => {
    (useVisualizationBuilder as jest.Mock).mockReturnValue(
      buildVisualizationBuilder({ type: 'bar', axesMapping: {} }, false)
    );
    render(<VisActionBar />);
    expect(screen.getByTestId('exploreShowRawDataSwitch')).toBeDisabled();
  });

  it('calls setShowRawTable when switch is toggled', () => {
    (useVisualizationBuilder as jest.Mock).mockReturnValue(
      buildVisualizationBuilder({ type: 'bar', axesMapping: { x: 'field' } }, false)
    );
    render(<VisActionBar />);
    fireEvent.click(screen.getByTestId('exploreShowRawDataSwitch'));
    expect(mockSetShowRawTable).toHaveBeenCalledWith(true);
  });
});

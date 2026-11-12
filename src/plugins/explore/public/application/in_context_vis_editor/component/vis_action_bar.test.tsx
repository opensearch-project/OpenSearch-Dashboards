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
// The raw table's query select lists the container's series.
jest.mock('../multi_query_builder/multi_query_builder_context', () => {
  const { BehaviorSubject: Subject } = jest.requireActual('rxjs');
  // One stable container, as the real Provider gives.
  const container = { getSeriesResult$: () => (global as any).mockSeries$ ?? new Subject([]) };
  return { useMultiQueryBuilder: () => container };
});
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
    rawTableRefId$: new BehaviorSubject(undefined),
    rawTableStage$: new BehaviorSubject('before'),
    pipelineResult$: new BehaviorSubject(undefined),
    setRawTableRefId: mockSetRawTableRefId,
    setRawTableStage: mockSetRawTableStage,
  },
});
const mockSetRawTableRefId = jest.fn();
const mockSetRawTableStage = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).mockSeries$ = undefined;
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

  describe('raw table selects', () => {
    const series = [
      { refId: 'A', rows: [], fieldSchema: [] },
      { refId: 'B', rows: [], fieldSchema: [] },
    ];
    const barConfig = { type: 'bar', axesMapping: { x: 'field' } };

    it('offers Final and each query, then the before / after select for a query', () => {
      (global as any).mockSeries$ = new BehaviorSubject(series);
      const builder = buildVisualizationBuilder(barConfig, true);
      builder.visualizationBuilderForEditor.pipelineResult$.next({ series } as any);
      (useVisualizationBuilder as jest.Mock).mockReturnValue(builder);
      render(<VisActionBar />);

      const options = Array.from(
        screen.getByTestId('exploreRawTableSelect').querySelectorAll('option')
      ).map((o) => o.getAttribute('value'));
      expect(options).toEqual(['__final__', 'A', 'B']);
      expect(screen.getByTestId('exploreRawTableStageSelect')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('exploreRawTableStageSelect'), {
        target: { value: 'after' },
      });
      expect(mockSetRawTableStage).toHaveBeenCalledWith('after');
    });

    it('hides the before / after select for Final', () => {
      (global as any).mockSeries$ = new BehaviorSubject(series);
      const builder = buildVisualizationBuilder(barConfig, true);
      builder.visualizationBuilderForEditor.rawTableRefId$.next('__final__' as any);
      (useVisualizationBuilder as jest.Mock).mockReturnValue(builder);
      render(<VisActionBar />);

      expect(screen.queryByTestId('exploreRawTableStageSelect')).not.toBeInTheDocument();
    });
  });
});

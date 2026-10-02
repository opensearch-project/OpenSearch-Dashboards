/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { AxisRole, VisFieldType } from '../types';
import { defaultSankeyChartStyles } from './sankey_vis_config';
import { SankeyVisStyleControls, SankeyVisStyleControlsProps } from './sankey_vis_options';

jest.mock('./sankey_exclusive_vis_options', () => ({
  SankeyExclusiveVisOptions: jest.fn(({ styles, onChange }) => (
    <button
      data-test-subj="sankeyOptions"
      onClick={() => onChange({ ...styles, orient: 'vertical' })}
    >
      Sankey
    </button>
  )),
}));

jest.mock('../style_panel/standard_options/standard_options_panel', () => ({
  StandardOptionsPanel: jest.fn(({ onDecimalsChange }) => (
    <button data-test-subj="standardOptions" onClick={() => onDecimalsChange(2)}>
      Standard options
    </button>
  )),
}));

jest.mock('../style_panel/tooltip/tooltip', () => ({
  TooltipOptionsPanel: jest.fn(({ onTooltipOptionsChange }) => (
    <button
      data-test-subj="tooltipOptions"
      onClick={() => onTooltipOptionsChange({ mode: 'hidden' })}
    >
      Tooltip
    </button>
  )),
}));

describe('SankeyVisStyleControls', () => {
  const onStyleChange = jest.fn();
  const props: SankeyVisStyleControlsProps = {
    styleOptions: defaultSankeyChartStyles,
    onStyleChange,
    numericalColumns: [],
    categoricalColumns: [],
    dateColumns: [],
    axisColumnMappings: {
      [AxisRole.SOURCE]: [
        {
          id: 1,
          name: 'Source',
          column: 'source',
          schema: VisFieldType.Categorical,
        },
      ],
      [AxisRole.TARGET]: [
        {
          id: 2,
          name: 'Target',
          column: 'target',
          schema: VisFieldType.Categorical,
        },
      ],
      [AxisRole.Value]: [
        {
          id: 3,
          name: 'Value',
          column: 'value',
          schema: VisFieldType.Numerical,
        },
      ],
    },
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Sankey, Standard options, and Tooltip controls and persists their changes', () => {
    render(<SankeyVisStyleControls {...props} />);

    fireEvent.click(screen.getByTestId('sankeyOptions'));
    expect(onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        ...defaultSankeyChartStyles.exclusive,
        orient: 'vertical',
      },
    });

    fireEvent.click(screen.getByTestId('standardOptions'));
    expect(onStyleChange).toHaveBeenCalledWith({ decimals: 2 });

    fireEvent.click(screen.getByTestId('tooltipOptions'));
    expect(onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { mode: 'hidden' },
    });
  });
});

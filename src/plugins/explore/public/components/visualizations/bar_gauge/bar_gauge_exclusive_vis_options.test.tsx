/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { BarGaugeExclusiveVisOptions } from './bar_gauge_exclusive_vis_options';
import { ExclusiveBarGaugeConfig } from './bar_gauge_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('BarGaugeExclusiveVisOptions', () => {
  const defaultStyles: ExclusiveBarGaugeConfig = {
    displayMode: 'gradient',
    valueDisplay: 'valueColor',
    showUnfilledArea: true,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call onChange when display style is changed', () => {
    const { getByText } = render(
      <BarGaugeExclusiveVisOptions styles={defaultStyles} onChange={mockOnChange} />
    );

    fireEvent.click(getByText('Stack'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultStyles,
      displayMode: 'stack',
    });
  });

  it('should call onChange when value display is changed', () => {
    const { getByText } = render(
      <BarGaugeExclusiveVisOptions styles={defaultStyles} onChange={mockOnChange} />
    );

    fireEvent.click(getByText('Text Color'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultStyles,
      valueDisplay: 'textColor',
    });
  });

  it('should call onChange when unfilled area switch is toggled', () => {
    const { getByRole } = render(
      <BarGaugeExclusiveVisOptions styles={defaultStyles} onChange={mockOnChange} />
    );

    const switchElement = getByRole('switch');
    fireEvent.click(switchElement);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultStyles,
      showUnfilledArea: false,
    });
  });

  it('should handle undefined styles with defaults', () => {
    const { getByText } = render(
      <BarGaugeExclusiveVisOptions styles={undefined as any} onChange={mockOnChange} />
    );

    fireEvent.click(getByText('Stack'));

    expect(mockOnChange).toHaveBeenCalledWith({
      displayMode: 'stack',
    });
  });
});

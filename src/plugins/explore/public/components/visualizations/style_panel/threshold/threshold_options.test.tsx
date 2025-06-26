/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThresholdOptions } from './threshold_options';
import { ThresholdLine, ThresholdLineStyle } from '../types';

describe('ThresholdOptions', () => {
  const defaultThresholdLine: ThresholdLine = {
    color: '#E7664C',
    show: true,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 2,
  };

  const onThresholdChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders threshold settings title', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    expect(screen.getByText('Threshold Settings')).toBeInTheDocument();
  });

  it('renders show threshold line switch', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    expect(screen.getByText('Show threshold line')).toBeInTheDocument();
  });

  it('calls onThresholdChange when show threshold line switch is toggled', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    const showThresholdSwitch = screen.getByRole('switch');
    fireEvent.click(showThresholdSwitch);

    expect(onThresholdChange).toHaveBeenCalledWith({
      ...defaultThresholdLine,
      show: false,
    });
  });

  it('renders threshold value input when show is true', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    expect(screen.getByText('Threshold value')).toBeInTheDocument();
    expect(screen.getByTestId('exploreVisThresholdValue')).toBeInTheDocument();
  });

  it('calls onThresholdChange when threshold value is changed', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    const valueInput = screen.getByTestId('exploreVisThresholdValue');
    fireEvent.change(valueInput, { target: { value: '20' } });

    expect(onThresholdChange).toHaveBeenCalledWith({
      ...defaultThresholdLine,
      value: 20,
    });
  });

  it('renders color picker when show is true', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    expect(screen.getByText('Line color')).toBeInTheDocument();
  });

  it('renders line style select when show is true', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    expect(screen.getByText('Line style')).toBeInTheDocument();
    expect(screen.getByTestId('exploreVisThresholdStyle')).toBeInTheDocument();
  });

  it('calls onThresholdChange when line style is changed', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    const styleSelect = screen.getByTestId('exploreVisThresholdStyle');
    fireEvent.change(styleSelect, { target: { value: ThresholdLineStyle.Dashed } });

    expect(onThresholdChange).toHaveBeenCalledWith({
      ...defaultThresholdLine,
      style: ThresholdLineStyle.Dashed,
    });
  });

  it('renders line width range when show is true', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    expect(screen.getByText('Line width')).toBeInTheDocument();
    expect(screen.getByTestId('exploreVisThresholdWidth')).toBeInTheDocument();
  });

  it('calls onThresholdChange when line width is changed', () => {
    render(
      <ThresholdOptions
        thresholdLine={defaultThresholdLine}
        onThresholdChange={onThresholdChange}
      />
    );
    const widthRange = screen.getByTestId('exploreVisThresholdWidth');
    fireEvent.change(widthRange, { target: { value: '5' } });

    expect(onThresholdChange).toHaveBeenCalledWith({
      ...defaultThresholdLine,
      width: 5,
    });
  });

  it('hides threshold options when show is false', () => {
    const hiddenThresholdLine: ThresholdLine = {
      ...defaultThresholdLine,
      show: false,
    };

    render(
      <ThresholdOptions thresholdLine={hiddenThresholdLine} onThresholdChange={onThresholdChange} />
    );

    expect(screen.queryByText('Threshold value')).not.toBeInTheDocument();
    expect(screen.queryByText('Line color')).not.toBeInTheDocument();
    expect(screen.queryByText('Line style')).not.toBeInTheDocument();
    expect(screen.queryByText('Line width')).not.toBeInTheDocument();
  });
});

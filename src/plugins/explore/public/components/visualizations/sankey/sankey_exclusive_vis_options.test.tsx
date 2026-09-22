/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { defaultSankeyChartStyles } from './sankey_vis_config';
import { SankeyExclusiveVisOptions } from './sankey_exclusive_vis_options';

jest.mock('@elastic/eui', () => {
  const actual = jest.requireActual('@elastic/eui');
  return {
    ...actual,
    EuiColorPicker: jest.fn(({ color, onChange, compressed: _compressed, ...props }) => (
      <input {...props} value={color} onChange={(event) => onChange(event.target.value)} />
    )),
  };
});

jest.mock('../style_panel/utils', () => ({
  DebouncedFieldNumber: jest.fn(
    ({
      value,
      onChange,
      defaultValue: _defaultValue,
      append: _append,
      compressed: _compressed,
      ...props
    }) => (
      <input {...props} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    )
  ),
  DebouncedFieldRange: jest.fn(
    ({
      value,
      onChange,
      defaultValue: _defaultValue,
      min: _min,
      max: _max,
      step: _step,
      ...props
    }) => (
      <input {...props} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    )
  ),
}));

describe('SankeyExclusiveVisOptions', () => {
  it('updates orientation and node alignment from the Sankey group', () => {
    const onChange = jest.fn();
    render(
      <SankeyExclusiveVisOptions styles={defaultSankeyChartStyles.exclusive} onChange={onChange} />
    );

    expect(screen.getByText('Sankey')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('sankeyOrientation'), {
      target: { value: 'vertical' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      orient: 'vertical',
    });

    fireEvent.change(screen.getByTestId('sankeyNodeAlign'), {
      target: { value: 'left' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      nodeAlign: 'left',
    });
  });

  it('updates node width and gap', () => {
    const onChange = jest.fn();
    render(
      <SankeyExclusiveVisOptions styles={defaultSankeyChartStyles.exclusive} onChange={onChange} />
    );

    fireEvent.change(screen.getByTestId('sankeyNodeWidth'), {
      target: { value: '30' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      nodeWidth: 30,
    });

    fireEvent.change(screen.getByTestId('sankeyNodeGap'), {
      target: { value: '12' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      nodeGap: 12,
    });
  });

  it('updates node labels, link labels, color, and opacity', () => {
    const onChange = jest.fn();
    render(
      <SankeyExclusiveVisOptions styles={defaultSankeyChartStyles.exclusive} onChange={onChange} />
    );

    fireEvent.click(screen.getByTestId('sankeyShowNodeLabels'));
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      showNodeLabels: false,
    });

    fireEvent.click(screen.getByTestId('sankeyShowLinkValues'));
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      showLinkLabels: true,
    });

    fireEvent.change(screen.getByTestId('sankeyLinkColor'), {
      target: { value: 'source' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      linkColor: 'source',
    });

    fireEvent.change(screen.getByTestId('sankeyLinkOpacity'), {
      target: { value: '60' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      linkOpacity: 0.6,
    });
    expect(screen.getByText('Link opacity')).toBeInTheDocument();
  });

  it('adds a node style override for the next Sankey level', () => {
    const onChange = jest.fn();
    render(
      <SankeyExclusiveVisOptions styles={defaultSankeyChartStyles.exclusive} onChange={onChange} />
    );

    fireEvent.click(screen.getByTestId('sankeyAddLevelStyle'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      levels: [{ depth: 0, opacity: 1 }],
    });
  });

  it('updates and removes a per-level node style', () => {
    const onChange = jest.fn();
    const styles = {
      ...defaultSankeyChartStyles.exclusive,
      levels: [{ depth: 0, color: '#111111', opacity: 1 }],
    };
    render(<SankeyExclusiveVisOptions styles={styles} onChange={onChange} />);

    fireEvent.change(screen.getByTestId('sankeyLevelDepth-0'), {
      target: { value: '2' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...styles,
      levels: [{ depth: 2, color: '#111111', opacity: 1 }],
    });

    fireEvent.change(screen.getByTestId('sankeyLevelColor-0'), {
      target: { value: '#abcdef' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...styles,
      levels: [{ depth: 0, color: '#abcdef', opacity: 1 }],
    });

    fireEvent.change(screen.getByTestId('sankeyLevelOpacity-0'), {
      target: { value: '50' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...styles,
      levels: [{ depth: 0, color: '#111111', opacity: 0.5 }],
    });
    expect(screen.getByText('Node opacity')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('sankeyRemoveLevelStyle-0'));
    expect(onChange).toHaveBeenCalledWith({
      ...styles,
      levels: [],
    });
  });
});

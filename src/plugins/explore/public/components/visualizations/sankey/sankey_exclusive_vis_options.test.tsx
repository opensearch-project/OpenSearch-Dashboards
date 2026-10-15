/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

describe('SankeyExclusiveVisOptions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const advanceDebounce = () => {
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };

  it('updates orientation without exposing node alignment', () => {
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
    expect(screen.queryByTestId('sankeyNodeAlign')).not.toBeInTheDocument();
  });

  it('updates node width without exposing node gap', () => {
    const onChange = jest.fn();
    render(
      <SankeyExclusiveVisOptions styles={defaultSankeyChartStyles.exclusive} onChange={onChange} />
    );

    fireEvent.change(screen.getByTestId('sankeyNodeWidth'), {
      target: { value: '30' },
    });
    advanceDebounce();
    expect(onChange).toHaveBeenCalledWith({
      ...defaultSankeyChartStyles.exclusive,
      nodeWidth: 30,
    });
    expect(screen.queryByTestId('sankeyNodeGap')).not.toBeInTheDocument();
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
    advanceDebounce();
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

  it('preserves focus when a level depth update is persisted', () => {
    const onChange = jest.fn();
    const styles = {
      ...defaultSankeyChartStyles.exclusive,
      levels: [{ depth: 0, color: '#111111', opacity: 1 }],
    };
    const { rerender } = render(<SankeyExclusiveVisOptions styles={styles} onChange={onChange} />);
    act(() => {
      screen.getByTestId('sankeyLevelDepth-0').focus();
    });

    rerender(
      <SankeyExclusiveVisOptions
        styles={{
          ...styles,
          levels: [{ depth: 2, color: '#111111', opacity: 1 }],
        }}
        onChange={onChange}
      />
    );

    expect(screen.getByTestId('sankeyLevelDepth-0')).toHaveFocus();
  });

  it('keeps the surviving level values when an earlier level is removed', () => {
    const TestHarness = () => {
      const [styles, setStyles] = useState({
        ...defaultSankeyChartStyles.exclusive,
        levels: [
          { depth: 0, color: '#111111', opacity: 0.2 },
          { depth: 1, color: '#222222', opacity: 0.8 },
        ],
      });

      return <SankeyExclusiveVisOptions styles={styles} onChange={setStyles} />;
    };

    render(<TestHarness />);

    expect(screen.getByTestId('sankeyLevelDepth-0')).toHaveValue(0);
    expect(screen.getByTestId('sankeyLevelDepth-1')).toHaveValue(1);

    fireEvent.click(screen.getByTestId('sankeyRemoveLevelStyle-0'));

    expect(screen.getByTestId('sankeyLevelDepth-0')).toHaveValue(1);
    expect(screen.queryByTestId('sankeyLevelDepth-1')).not.toBeInTheDocument();
  });

  it.each([
    ['fractional', '1.5', 1],
    ['negative', '-1', 0],
  ])('normalizes %s level depths to non-negative integers', (_, value, expectedDepth) => {
    const onChange = jest.fn();
    const styles = {
      ...defaultSankeyChartStyles.exclusive,
      levels: [{ depth: 2, color: '#111111', opacity: 1 }],
    };
    render(<SankeyExclusiveVisOptions styles={styles} onChange={onChange} />);

    fireEvent.change(screen.getByTestId('sankeyLevelDepth-0'), {
      target: { value },
    });
    advanceDebounce();

    expect(onChange).toHaveBeenCalledWith({
      ...styles,
      levels: [{ depth: expectedDepth, color: '#111111', opacity: 1 }],
    });
  });

  it('allows duplicate level depths', () => {
    const onChange = jest.fn();
    const styles = {
      ...defaultSankeyChartStyles.exclusive,
      levels: [
        { depth: 0, color: '#111111', opacity: 1 },
        { depth: 2, color: '#222222', opacity: 1 },
      ],
    };
    render(<SankeyExclusiveVisOptions styles={styles} onChange={onChange} />);

    fireEvent.change(screen.getByTestId('sankeyLevelDepth-1'), {
      target: { value: '0' },
    });
    advanceDebounce();

    expect(onChange).toHaveBeenCalledWith({
      ...styles,
      levels: [
        { depth: 0, color: '#111111', opacity: 1 },
        { depth: 0, color: '#222222', opacity: 1 },
      ],
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
    advanceDebounce();
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
    advanceDebounce();
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

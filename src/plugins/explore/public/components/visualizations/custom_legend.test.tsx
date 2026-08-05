/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { CustomLegend } from './custom_legend';
import { Positions } from './types';
import { LegendItem, LegendTarget } from './utils/legend';

describe('CustomLegend', () => {
  const legendItems: LegendItem[] = [
    {
      label: 'seriesA',
      color: '#5C7FFF',
      target: { type: 'series', name: 'seriesA' },
    },
    {
      label: 'seriesB',
      color: '#A669E2',
      target: { type: 'series', name: 'seriesB' },
    },
    {
      label: 'seriesC',
      color: '#FF4B14',
      target: { type: 'series', name: 'seriesC' },
    },
  ];

  let legend$: BehaviorSubject<Record<string, LegendItem[]>>;
  let legendSelected$: BehaviorSubject<Record<string, boolean>>;
  let highlightedLegendTarget$: BehaviorSubject<LegendTarget | undefined>;

  beforeEach(() => {
    legend$ = new BehaviorSubject<Record<string, LegendItem[]>>({ default: legendItems });
    legendSelected$ = new BehaviorSubject<Record<string, boolean>>({});
    highlightedLegendTarget$ = new BehaviorSubject<LegendTarget | undefined>(undefined);
  });

  it('renders all legend items', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    expect(getByTestId('customLegend')).toBeInTheDocument();
    expect(getByTestId('customLegendItem-seriesA')).toBeInTheDocument();
    expect(getByTestId('customLegendItem-seriesB')).toBeInTheDocument();
    expect(getByTestId('customLegendItem-seriesC')).toBeInTheDocument();
  });

  it('displays series names as labels', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    expect(getByTestId('customLegendItem-seriesA')).toHaveTextContent('seriesA');
    expect(getByTestId('customLegendItem-seriesB')).toHaveTextContent('seriesB');
  });

  it('toggles series selection on click and emits to legendSelected$', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    const item = getByTestId('customLegendItem-seriesA');
    fireEvent.click(item);

    expect(legendSelected$.getValue()).toEqual({ seriesA: false });
    expect(item).toHaveClass('customLegend__item--hidden');

    fireEvent.click(item);

    expect(legendSelected$.getValue()).toEqual({ seriesA: true });
    expect(item).not.toHaveClass('customLegend__item--hidden');
  });

  it('emits highlighted series on mouse enter', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    fireEvent.mouseEnter(getByTestId('customLegendItem-seriesB'));
    expect(highlightedLegendTarget$.getValue()).toEqual({ type: 'series', name: 'seriesB' });
  });

  it('clears highlighted series on mouse leave', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    fireEvent.mouseEnter(getByTestId('customLegendItem-seriesB'));
    fireEvent.mouseLeave(getByTestId('customLegendItem-seriesB'));
    expect(highlightedLegendTarget$.getValue()).toBeUndefined();
  });

  it('does not highlight a hidden series on hover', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    // Hide seriesA
    fireEvent.click(getByTestId('customLegendItem-seriesA'));
    expect(legendSelected$.getValue()).toEqual({ seriesA: false });

    // Hover hidden item
    fireEvent.mouseEnter(getByTestId('customLegendItem-seriesA'));
    expect(highlightedLegendTarget$.getValue()).toBeUndefined();
  });

  it('applies horizontal layout by default (bottom position)', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
        position={Positions.BOTTOM}
      />
    );

    expect(getByTestId('customLegend')).toHaveClass('customLegend--horizontal');
  });

  it('applies vertical layout for left position', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
        position={Positions.LEFT}
      />
    );

    expect(getByTestId('customLegend')).toHaveClass('customLegend--vertical');
  });

  it('applies vertical layout for right position', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
        position={Positions.RIGHT}
      />
    );

    expect(getByTestId('customLegend')).toHaveClass('customLegend--vertical');
  });

  it('sets indicator color from legend item color', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    const indicator = getByTestId('customLegendItem-seriesA').querySelector(
      '.customLegend__indicator'
    );
    expect(indicator).toHaveStyle({ backgroundColor: '#5C7FFF' });
  });

  it('removes indicator color when hidden', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    fireEvent.click(getByTestId('customLegendItem-seriesA'));

    const indicator = getByTestId('customLegendItem-seriesA').querySelector(
      '.customLegend__indicator'
    );
    expect(indicator).not.toHaveStyle({ backgroundColor: '#5C7FFF' });
  });

  it('dedupes legend items by target across split groups', () => {
    legend$.next({
      splitA: [legendItems[0], legendItems[1]],
      splitB: [
        {
          ...legendItems[1],
          color: '#000000',
        },
        legendItems[2],
      ],
    });

    const { getAllByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    expect(getAllByTestId(/customLegendItem-/)).toHaveLength(3);
  });
});

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

  it('does not render when there is only one legend item', () => {
    legend$.next({ default: [legendItems[0]] });

    const { queryByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    expect(queryByTestId('customLegend')).not.toBeInTheDocument();
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

  it('focuses the clicked series and selects all when the focused series is clicked again', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    const item = getByTestId('customLegendItem-seriesA');
    fireEvent.click(item);

    expect(legendSelected$.getValue()).toEqual({
      seriesA: true,
      seriesB: false,
      seriesC: false,
    });
    expect(item).not.toHaveClass('customLegend__item--hidden');
    expect(getByTestId('customLegendItem-seriesB')).toHaveClass('customLegend__item--hidden');
    expect(getByTestId('customLegendItem-seriesC')).toHaveClass('customLegend__item--hidden');

    fireEvent.click(item);

    expect(legendSelected$.getValue()).toEqual({
      seriesA: true,
      seriesB: true,
      seriesC: true,
    });
    expect(getByTestId('customLegendItem-seriesB')).not.toHaveClass('customLegend__item--hidden');
    expect(getByTestId('customLegendItem-seriesC')).not.toHaveClass('customLegend__item--hidden');
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
  ])('adds and removes a series from the focused selection with %s-click', (_, modifier) => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    fireEvent.click(getByTestId('customLegendItem-seriesA'));
    fireEvent.click(getByTestId('customLegendItem-seriesB'), modifier);

    expect(legendSelected$.getValue()).toEqual({
      seriesA: true,
      seriesB: true,
      seriesC: false,
    });

    fireEvent.click(getByTestId('customLegendItem-seriesA'), modifier);

    expect(legendSelected$.getValue()).toEqual({
      seriesA: false,
      seriesB: true,
      seriesC: false,
    });
  });

  it('supports legend names that are special object properties', () => {
    const specialNameItem: LegendItem = {
      label: '__proto__',
      color: '#54B399',
      target: { type: 'series', name: '__proto__' },
    };
    legend$.next({ default: [specialNameItem, legendItems[0]] });

    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    fireEvent.click(getByTestId('customLegendItem-__proto__'), { ctrlKey: true });

    expect(legendSelected$.getValue()).toEqual({
      ['__proto__']: false,
      seriesA: true,
    });
    expect(getByTestId('customLegendItem-__proto__')).toHaveClass('customLegend__item--hidden');
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

    fireEvent.click(getByTestId('customLegendItem-seriesA'), { ctrlKey: true });
    expect(legendSelected$.getValue()).toEqual({
      seriesA: false,
      seriesB: true,
      seriesC: true,
    });

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

    fireEvent.click(getByTestId('customLegendItem-seriesA'), { ctrlKey: true });

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

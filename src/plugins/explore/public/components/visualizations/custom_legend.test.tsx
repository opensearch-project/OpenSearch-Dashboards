/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { CustomLegend } from './custom_legend';
import { Positions } from './types';
import { ColorMap } from './utils/color_map';

describe('CustomLegend', () => {
  const colorMap: ColorMap = {
    seriesA: '#5C7FFF',
    seriesB: '#A669E2',
    seriesC: '#FF4B14',
  };

  let legend$: BehaviorSubject<Record<string, ColorMap>>;
  let legendSelected$: BehaviorSubject<Record<string, boolean>>;
  let highlightedSeries$: BehaviorSubject<string | undefined>;

  beforeEach(() => {
    legend$ = new BehaviorSubject<Record<string, ColorMap>>({ default: colorMap });
    legendSelected$ = new BehaviorSubject<Record<string, boolean>>({});
    highlightedSeries$ = new BehaviorSubject<string | undefined>(undefined);
  });

  it('renders all legend items', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedSeries$={highlightedSeries$}
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
        highlightedSeries$={highlightedSeries$}
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
        highlightedSeries$={highlightedSeries$}
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
        highlightedSeries$={highlightedSeries$}
      />
    );

    fireEvent.mouseEnter(getByTestId('customLegendItem-seriesB'));
    expect(highlightedSeries$.getValue()).toBe('seriesB');
  });

  it('clears highlighted series on mouse leave', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedSeries$={highlightedSeries$}
      />
    );

    fireEvent.mouseEnter(getByTestId('customLegendItem-seriesB'));
    fireEvent.mouseLeave(getByTestId('customLegendItem-seriesB'));
    expect(highlightedSeries$.getValue()).toBeUndefined();
  });

  it('does not highlight a hidden series on hover', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedSeries$={highlightedSeries$}
      />
    );

    // Hide seriesA
    fireEvent.click(getByTestId('customLegendItem-seriesA'));
    expect(legendSelected$.getValue()).toEqual({ seriesA: false });

    // Hover hidden item
    fireEvent.mouseEnter(getByTestId('customLegendItem-seriesA'));
    expect(highlightedSeries$.getValue()).toBeUndefined();
  });

  it('applies horizontal layout by default (bottom position)', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedSeries$={highlightedSeries$}
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
        highlightedSeries$={highlightedSeries$}
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
        highlightedSeries$={highlightedSeries$}
        position={Positions.RIGHT}
      />
    );

    expect(getByTestId('customLegend')).toHaveClass('customLegend--vertical');
  });

  it('sets indicator color from colorMap', () => {
    const { getByTestId } = render(
      <CustomLegend
        legend$={legend$}
        legendSelected$={legendSelected$}
        highlightedSeries$={highlightedSeries$}
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
        highlightedSeries$={highlightedSeries$}
      />
    );

    fireEvent.click(getByTestId('customLegendItem-seriesA'));

    const indicator = getByTestId('customLegendItem-seriesA').querySelector(
      '.customLegend__indicator'
    );
    expect(indicator).not.toHaveStyle({ backgroundColor: '#5C7FFF' });
  });
});

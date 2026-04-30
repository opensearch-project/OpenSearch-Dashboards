/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarGaugeRender } from './bar_gauge_render';
import { defaultBarGaugeChartStyles } from './bar_gauge_vis_config';

// ResizeObserver is not available in jsdom
global.ResizeObserver = class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
};

jest.mock('./bar_gauge_component.scss', () => ({}));

// Mock BarGaugeItem to isolate render logic from item rendering details
jest.mock('./bar_gauge_item', () => ({
  BarGaugeItem: function MockBarGaugeItem(props: any) {
    return React.createElement('div', {
      'data-testid': 'bar-gauge-item',
      'data-category': props.item.category,
      'data-value': String(props.item.value),
      'data-percentage': String(props.item.percentage),
      'data-display-value': props.item.displayValue,
    });
  },
}));

jest.mock('../style_panel/unit/collection', () => ({
  getUnitById: jest.fn(() => undefined),
}));

const defaultStyles = defaultBarGaugeChartStyles;

describe('BarGaugeRender', () => {
  describe('rendering items', () => {
    it('renders one BarGaugeItem per data entry', () => {
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 30 },
      ];
      render(<BarGaugeRender data={data} styles={defaultStyles} isHorizontal={false} />);
      expect(screen.getAllByTestId('bar-gauge-item')).toHaveLength(3);
    });

    it('renders with empty data without crashing', () => {
      render(<BarGaugeRender data={[]} styles={defaultStyles} isHorizontal={false} />);
      expect(screen.queryAllByTestId('bar-gauge-item')).toHaveLength(0);
    });

    it('renders correct category labels', () => {
      const data = [
        { category: 'Alpha', value: 50 },
        { category: 'Beta', value: 80 },
      ];
      render(<BarGaugeRender data={data} styles={defaultStyles} isHorizontal={false} />);
      const items = screen.getAllByTestId('bar-gauge-item');
      expect(items[0].getAttribute('data-category')).toBe('Alpha');
      expect(items[1].getAttribute('data-category')).toBe('Beta');
    });

    it('handles null values', () => {
      const data = [{ category: 'Null', value: null }];
      render(<BarGaugeRender data={data} styles={defaultStyles} isHorizontal={false} />);
      const item = screen.getByTestId('bar-gauge-item');
      expect(item.getAttribute('data-value')).toBe('null');
      expect(item.getAttribute('data-percentage')).toBe('0');
    });
  });

  describe('percentage calculation', () => {
    it('calculates percentage correctly within min/max range', () => {
      const data = [{ category: 'A', value: 50 }];
      const styles = { ...defaultStyles, min: 0, max: 100 };
      render(<BarGaugeRender data={data} styles={styles} isHorizontal={false} />);
      const item = screen.getByTestId('bar-gauge-item');
      expect(item.getAttribute('data-percentage')).toBe('50');
    });

    it('clamps percentage to 100 when value exceeds max', () => {
      const data = [{ category: 'A', value: 150 }];
      const styles = { ...defaultStyles, min: 0, max: 100 };
      render(<BarGaugeRender data={data} styles={styles} isHorizontal={false} />);
      const item = screen.getByTestId('bar-gauge-item');
      expect(item.getAttribute('data-percentage')).toBe('100');
    });

    it('clamps percentage to 0 when value is below min', () => {
      const data = [{ category: 'A', value: -10 }];
      const styles = { ...defaultStyles, min: 0, max: 100 };
      render(<BarGaugeRender data={data} styles={styles} isHorizontal={false} />);
      const item = screen.getByTestId('bar-gauge-item');
      expect(item.getAttribute('data-percentage')).toBe('0');
    });

    it('uses data range when min/max not specified', () => {
      const data = [
        { category: 'A', value: 0 },
        { category: 'B', value: 100 },
      ];
      render(<BarGaugeRender data={data} styles={defaultStyles} isHorizontal={false} />);
      const items = screen.getAllByTestId('bar-gauge-item');
      expect(items[0].getAttribute('data-percentage')).toBe('0');
      expect(items[1].getAttribute('data-percentage')).toBe('100');
    });
  });

  describe('value formatting', () => {
    it('formats numeric values with rounding', () => {
      const data = [{ category: 'A', value: 42.567 }];
      const styles = { ...defaultStyles, min: 0, max: 100 };
      render(<BarGaugeRender data={data} styles={styles} isHorizontal={false} />);
      const item = screen.getByTestId('bar-gauge-item');
      expect(item.getAttribute('data-display-value')).toBe('42.57');
    });

    it('displays "-" for null values', () => {
      const data = [{ category: 'A', value: null }];
      render(<BarGaugeRender data={data} styles={defaultStyles} isHorizontal={false} />);
      const item = screen.getByTestId('bar-gauge-item');
      expect(item.getAttribute('data-display-value')).toBe('-');
    });
  });

  describe('container class', () => {
    it('applies horizontal class when isHorizontal is true', () => {
      const { container } = render(
        <BarGaugeRender data={[]} styles={defaultStyles} isHorizontal={true} />
      );
      expect(container.querySelector('.main-bar-gauge-container')).toHaveClass('horizontal');
    });

    it('applies vertical class when isHorizontal is false', () => {
      const { container } = render(
        <BarGaugeRender data={[]} styles={defaultStyles} isHorizontal={false} />
      );
      expect(container.querySelector('.main-bar-gauge-container')).toHaveClass('vertical');
    });
  });

  describe('invalid scale handling', () => {
    it('sets percentage to 0 when min >= max', () => {
      const data = [{ category: 'A', value: 50 }];
      const styles = { ...defaultStyles, min: 100, max: 50 };
      render(<BarGaugeRender data={data} styles={styles} isHorizontal={false} />);
      const item = screen.getByTestId('bar-gauge-item');
      expect(item.getAttribute('data-percentage')).toBe('0');
    });
  });
});

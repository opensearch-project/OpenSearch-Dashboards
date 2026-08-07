/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { BarGaugeItem, BarGaugeItemData } from './bar_gauge_item';
import { BarGaugeChartStyle, defaultBarGaugeChartStyles } from './bar_gauge_vis_config';

const makeItem = (overrides: Partial<BarGaugeItemData> = {}): BarGaugeItemData => ({
  category: 'Category A',
  value: 80,
  displayValue: '50',
  fontColor: '#ff0000',
  thresholds: [
    { value: 0, color: '#00bd6b' },
    { value: 50, color: '#ff0000' },
  ],
  percentage: 50,
  stackSegments: null,
  ...overrides,
});

const makeStyles = (
  overrides: Partial<BarGaugeChartStyle['exclusive']> = {}
): BarGaugeChartStyle => ({
  ...defaultBarGaugeChartStyles,
  exclusive: {
    ...defaultBarGaugeChartStyles.exclusive,
    ...overrides,
  },
});

describe('BarGaugeItem', () => {
  describe('vertical orientation', () => {
    it('renders category label', () => {
      render(<BarGaugeItem item={makeItem()} styles={makeStyles()} isHorizontal={false} />);
      expect(screen.getByText('Category A')).toBeInTheDocument();
    });

    it('renders display value', () => {
      render(
        <BarGaugeItem
          item={makeItem({ displayValue: '42.5' })}
          styles={makeStyles({ showUnfilledArea: true })}
          isHorizontal={false}
        />
      );
      expect(screen.getByText('42.5')).toBeInTheDocument();
    });

    it('hides value label with visibility:hidden when showUnfilledArea is off', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem({ displayValue: '42.5' })}
          styles={makeStyles({ showUnfilledArea: false })}
          isHorizontal={false}
        />
      );
      // flex sibling value should be in DOM but hidden
      const valueEls = container.querySelectorAll('.bar-gauge-value');
      const hiddenEl = Array.from(valueEls).find(
        (el) => (el as HTMLElement).style.visibility === 'hidden'
      );
      expect(hiddenEl).toBeTruthy();
    });

    it('hides value when valueDisplay is hidden', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem({ displayValue: '42.5' })}
          styles={makeStyles({ valueDisplay: 'hidden', showUnfilledArea: true })}
          isHorizontal={false}
        />
      );
      const valueEl = container.querySelector('.bar-gauge-value') as HTMLElement;
      expect(valueEl.style.visibility).toBe('hidden');
    });

    it('renders bar fill with correct height percentage', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem({ percentage: 75 })}
          styles={makeStyles()}
          isHorizontal={false}
        />
      );
      const fill = container.querySelector('.bar-gauge-fill') as HTMLElement;
      expect(fill.style.height).toBe('75%');
    });

    it('renders null value', () => {
      render(
        <BarGaugeItem
          item={makeItem({ value: null, displayValue: '-', percentage: 0 })}
          styles={makeStyles()}
          isHorizontal={false}
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('applies valueFontSize when provided', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem()}
          styles={makeStyles({ showUnfilledArea: true })}
          isHorizontal={false}
          valueFontSize={16}
        />
      );
      const valueEl = container.querySelector('.bar-gauge-value') as HTMLElement;
      expect(valueEl.style.fontSize).toBe('16px');
    });
  });

  describe('horizontal orientation', () => {
    it('renders category label', () => {
      render(<BarGaugeItem item={makeItem()} styles={makeStyles()} isHorizontal={true} />);
      expect(screen.getByText('Category A')).toBeInTheDocument();
    });

    it('renders display value', () => {
      render(
        <BarGaugeItem
          item={makeItem({ displayValue: '89.2' })}
          styles={makeStyles({ valueDisplay: 'valueColor' })}
          isHorizontal={true}
        />
      );
      expect(screen.getByText('89.2')).toBeInTheDocument();
    });

    it('does not render value element when valueDisplay is hidden', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem({ displayValue: '89.2' })}
          styles={makeStyles({ valueDisplay: 'hidden' })}
          isHorizontal={true}
        />
      );
      const valueEls = container.querySelectorAll('.bar-gauge-value');
      expect(valueEls.length).toBe(0);
    });

    it('renders bar fill with correct width percentage', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem({ percentage: 60 })}
          styles={makeStyles()}
          isHorizontal={true}
        />
      );
      const fill = container.querySelector('.bar-gauge-fill') as HTMLElement;
      expect(fill.style.width).toBe('60%');
    });
  });

  describe('display modes', () => {
    it('renders stacked bar when displayMode is stack and stackSegments provided', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem({
            percentage: 80,
            stackSegments: [
              { segPercentage: 50, color: '#00bd6b' },
              { segPercentage: 50, color: '#ff0000' },
            ],
          })}
          styles={makeStyles({ displayMode: 'stack' })}
          isHorizontal={false}
        />
      );
      expect(container.querySelector('.bar-gauge-stack')).toBeInTheDocument();
      expect(container.querySelector('.bar-gauge-fill')).not.toBeInTheDocument();
    });

    it('renders solid color fill for basic mode', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem()}
          styles={makeStyles({ displayMode: 'basic' })}
          isHorizontal={false}
        />
      );
      const fill = container.querySelector('.bar-gauge-fill') as HTMLElement;
      expect(fill.style.background).toBe('rgb(255, 0, 0)');
    });
  });

  describe('unfilled area', () => {
    it('shows background color when showUnfilledArea is on', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem()}
          styles={makeStyles({ showUnfilledArea: true })}
          isHorizontal={false}
        />
      );
      const bg = container.querySelector('.bar-gauge-background') as HTMLElement;
      expect(bg.style.backgroundColor).not.toBe('transparent');
    });

    it('uses transparent background when showUnfilledArea is off', () => {
      const { container } = render(
        <BarGaugeItem
          item={makeItem()}
          styles={makeStyles({ showUnfilledArea: false })}
          isHorizontal={false}
        />
      );
      const bg = container.querySelector('.bar-gauge-background') as HTMLElement;
      expect(bg.style.backgroundColor).toBe('transparent');
    });
  });
});

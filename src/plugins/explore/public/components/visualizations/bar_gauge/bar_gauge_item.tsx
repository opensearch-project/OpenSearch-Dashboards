/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { Threshold } from '../types';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { getColors } from '../theme/default_colors';

export interface BarGaugeData {
  category: string;
  value: number | null;
}

export interface BarGaugeItemData {
  category: string;
  value: number | null;
  displayValue: string;
  fontColor: string;
  thresholds: Threshold[];
  percentage: number;
  stackSegments: Array<{ segPercentage: number; color: string }> | null;
}

interface BarGaugeItemProps {
  item: BarGaugeItemData;
  styles: BarGaugeChartStyle;
  isHorizontal: boolean;
  valueFontSize?: number;
}

const buildGradientBackground = (thresholds: Threshold[], isHorizontal: boolean): string => {
  if (thresholds.length === 0) return getColors().statusGreen;
  if (thresholds.length === 1) return thresholds[0].color;

  const start = thresholds[0].value;
  const end = thresholds[thresholds.length - 1].value;
  const range = end - start;

  if (range === 0) return thresholds[thresholds.length - 1].color;

  const stops = thresholds.map((t) => {
    const offset = ((t.value - start) / range) * 100;
    return `${t.color} ${offset.toFixed(1)}%`;
  });

  const direction = isHorizontal ? 'to right' : 'to top';
  return `linear-gradient(${direction}, ${stops.join(', ')})`;
};

export const BarGaugeItem: React.FC<BarGaugeItemProps> = ({
  item,
  styles,
  isHorizontal,
  valueFontSize,
}) => {
  const { category, value, displayValue, fontColor, thresholds, percentage, stackSegments } = item;
  const orientation = isHorizontal ? 'horizontal' : 'vertical';

  const barFill = (() => {
    if (value === null) return 'transparent';
    switch (styles.exclusive.displayMode) {
      case 'gradient':
        return buildGradientBackground(thresholds, isHorizontal);
      case 'basic':
        return thresholds[thresholds.length - 1]?.color ?? getColors().statusGreen;
      default:
        return thresholds[thresholds.length - 1]?.color ?? getColors().statusGreen;
    }
  })();

  const renderStackedBar = () => {
    if (!stackSegments) return null;
    return (
      <div
        className={`bar-gauge-stack ${orientation}`}
        style={{ [isHorizontal ? 'width' : 'height']: `${percentage}%` }}
      >
        {stackSegments.map((seg, i) => (
          <div key={i} style={{ flex: `0 0 ${seg.segPercentage}%`, backgroundColor: seg.color }} />
        ))}
      </div>
    );
  };

  const valueStyle: React.CSSProperties = {
    color: fontColor,
    ...(valueFontSize !== undefined && { fontSize: valueFontSize }),
  };

  const showUnfilled = styles.exclusive.showUnfilledArea;
  const valueHidden = styles.exclusive.valueDisplay === 'hidden';

  const unfilledBackground = styles.exclusive.showUnfilledArea
    ? getColors().backgroundShade
    : 'transparent';

  const clampValueStyle: React.CSSProperties = {
    ...valueStyle,
    position: 'absolute',
    bottom: `${percentage}%`,
    left: '50%',
    transform: 'translateX(-50%)',
  };

  const bar = (
    <div className="bar-gauge-background" style={{ backgroundColor: unfilledBackground }}>
      {styles.exclusive.displayMode === 'stack' ? (
        renderStackedBar()
      ) : (
        <div
          className="bar-gauge-fill"
          style={{
            [isHorizontal ? 'width' : 'height']: `${percentage}%`,
            background: barFill,
          }}
        />
      )}
      {!isHorizontal && !showUnfilled && !valueHidden && (
        <div className="bar-gauge-value" style={clampValueStyle}>
          {displayValue}
        </div>
      )}
    </div>
  );

  // when unfilled area is off, value set to hidden to perserve the layout for vertical case
  const valueLabel = (
    <div
      className="bar-gauge-value"
      style={!valueHidden && showUnfilled ? valueStyle : { visibility: 'hidden' }}
    >
      {displayValue}
    </div>
  );

  const categoryLabel = <div className="bar-gauge-label">{category}</div>;

  const renderVertical = () => {
    return (
      <div className={`bar-gauge-item ${orientation}`}>
        {valueLabel}
        {bar}
        {categoryLabel}
      </div>
    );
  };

  const renderHorizontal = () => {
    return (
      <EuiFlexGroup direction="column" justifyContent="center" gutterSize="xs">
        {!valueHidden && (
          <EuiFlexItem grow={false}>
            {/* 80px = category label width, 8px = padding */}
            <div style={{ paddingLeft: 80 + 8 }}>
              <div className="bar-gauge-value" style={valueStyle}>
                {displayValue}
              </div>
            </div>
          </EuiFlexItem>
        )}
        <EuiFlexItem>
          <div className={`bar-gauge-item ${orientation}`}>
            {categoryLabel}
            {bar}
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  return isHorizontal ? renderHorizontal() : renderVertical();
};

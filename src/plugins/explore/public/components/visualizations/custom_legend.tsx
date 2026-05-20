/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import { ColorMap } from './utils/color_map';
import { Positions } from './types';

import './custom_legend.scss';

interface CustomLegendProps {
  legend$: BehaviorSubject<Record<string, ColorMap>>;
  legendSelected$: BehaviorSubject<Record<string, boolean>>;
  highlightedSeries$: BehaviorSubject<string | undefined>;
  position?: Positions;
}

export const CustomLegend: React.FC<CustomLegendProps> = ({
  legend$,
  legendSelected$,
  highlightedSeries$,
  position = Positions.BOTTOM,
}) => {
  const legendMap = useObservable(legend$);
  const colorMap = useMemo(() => {
    if (!legendMap) return {};
    const merged: ColorMap = {};
    Object.values(legendMap).forEach((map) => Object.assign(merged, map));
    const sorted: ColorMap = {};
    Object.keys(merged)
      .sort()
      .forEach((name) => {
        sorted[name] = merged[name];
      });
    return sorted;
  }, [legendMap]);
  const selected = useObservable(legendSelected$) ?? {};
  const isVertical = position === Positions.LEFT || position === Positions.RIGHT;

  const handleToggle = useCallback(
    (name: string) => {
      const prev = legendSelected$.getValue();
      const next = { ...prev, [name]: prev[name] === undefined ? false : !prev[name] };
      legendSelected$.next(next);
    },
    [legendSelected$]
  );

  const handleMouseEnter = useCallback(
    (name: string) => {
      const sel = legendSelected$.getValue();
      if (sel[name] !== false) {
        highlightedSeries$.next(name);
      }
    },
    [highlightedSeries$, legendSelected$]
  );

  const handleMouseLeave = useCallback(() => {
    highlightedSeries$.next(undefined);
  }, [highlightedSeries$]);

  if (Object.keys(colorMap).length === 0) {
    return null;
  }

  return (
    <div
      className={`customLegend ${
        isVertical ? 'customLegend--vertical' : 'customLegend--horizontal'
      }`}
      data-test-subj="customLegend"
    >
      {Object.entries(colorMap).map(([name, color]) => {
        const isHidden = selected[name] === false;
        return (
          <button
            key={name}
            className={`customLegend__item ${isHidden ? 'customLegend__item--hidden' : ''}`}
            onClick={() => handleToggle(name)}
            onMouseEnter={() => handleMouseEnter(name)}
            onMouseLeave={handleMouseLeave}
            title={name}
            type="button"
            data-test-subj={`customLegendItem-${name}`}
          >
            <span
              className="customLegend__indicator"
              style={{ backgroundColor: isHidden ? undefined : color }}
            />
            <span className="customLegend__label">{name}</span>
          </button>
        );
      })}
    </div>
  );
};

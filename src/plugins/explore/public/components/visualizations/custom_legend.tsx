/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import { Positions } from './types';
import { dedupeLegendItems, getLegendTargetKey, LegendItem, LegendTarget } from './utils/legend';

import './custom_legend.scss';

interface CustomLegendProps {
  legend$: BehaviorSubject<Record<string, LegendItem[]>>;
  legendSelected$: BehaviorSubject<Record<string, boolean>>;
  highlightedLegendTarget$: BehaviorSubject<LegendTarget | undefined>;
  position?: Positions;
}

export const CustomLegend: React.FC<CustomLegendProps> = ({
  legend$,
  legendSelected$,
  highlightedLegendTarget$,
  position = Positions.BOTTOM,
}) => {
  const legendMap = useObservable(legend$);
  const legendItems = useMemo(() => {
    if (!legendMap) return [];
    return dedupeLegendItems(Object.values(legendMap).flat());
  }, [legendMap]);
  const selected = useObservable(legendSelected$) ?? {};
  const isVertical = position === Positions.LEFT || position === Positions.RIGHT;

  const handleLegendClick = useCallback(
    (item: LegendItem, event: React.MouseEvent<HTMLButtonElement>) => {
      const name = item.target.name;
      const prev = legendSelected$.getValue();
      const isMultiSelect = event.ctrlKey || event.metaKey;

      // Missing entries are selected by default, so only explicit false values are hidden.
      const selectedItems = legendItems.filter(
        (legendItem) => prev[legendItem.target.name] !== false
      );

      // A plain click on the sole selected item restores all items.
      const shouldSelectAll =
        !isMultiSelect && selectedItems.length === 1 && selectedItems[0].target.name === name;

      // Object.fromEntries preserves data-derived names such as "__proto__" as own properties.
      const next = Object.fromEntries(
        legendItems.map((legendItem) => {
          const legendName = legendItem.target.name;
          if (isMultiSelect) {
            const isSelected =
              legendName === name ? prev[name] === false : prev[legendName] !== false;
            return [legendName, isSelected];
          }

          return [legendName, shouldSelectAll || legendName === name];
        })
      );

      legendSelected$.next(next);
    },
    [legendItems, legendSelected$]
  );

  const handleMouseEnter = useCallback(
    (item: LegendItem) => {
      const name = item.target.name;
      const sel = legendSelected$.getValue();
      if (sel[name] !== false) {
        highlightedLegendTarget$.next(item.target);
      }
    },
    [highlightedLegendTarget$, legendSelected$]
  );

  const handleMouseLeave = useCallback(() => {
    highlightedLegendTarget$.next(undefined);
  }, [highlightedLegendTarget$]);

  if (legendItems.length <= 1) {
    return null;
  }

  return (
    <div
      className={`customLegend ${
        isVertical ? 'customLegend--vertical' : 'customLegend--horizontal'
      }`}
      data-test-subj="customLegend"
    >
      {legendItems.map((item) => {
        const name = item.target.name;
        const isHidden = selected[name] === false;
        return (
          <button
            key={getLegendTargetKey(item.target)}
            className={`customLegend__item ${isHidden ? 'customLegend__item--hidden' : ''}`}
            onClick={(event) => handleLegendClick(item, event)}
            onMouseEnter={() => handleMouseEnter(item)}
            onMouseLeave={handleMouseLeave}
            title={item.label}
            type="button"
            data-test-subj={`customLegendItem-${name}`}
          >
            <span
              className="customLegend__indicator"
              style={{ backgroundColor: isHidden ? undefined : item.color }}
            />
            <span className="customLegend__label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

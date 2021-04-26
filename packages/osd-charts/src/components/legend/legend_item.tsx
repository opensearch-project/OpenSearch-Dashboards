/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import classNames from 'classnames';
import React, { Component, createRef, MouseEventHandler } from 'react';

import { LegendItem, LegendItemExtraValues } from '../../common/legend';
import { SeriesIdentifier } from '../../common/series_id';
import {
  LegendItemListener,
  BasicListener,
  LegendColorPicker,
  LegendAction,
  LegendPositionConfig,
} from '../../specs/settings';
import {
  clearTemporaryColors as clearTemporaryColorsAction,
  setTemporaryColor as setTemporaryColorAction,
  setPersistedColor as setPersistedColorAction,
} from '../../state/actions/colors';
import {
  onLegendItemOutAction,
  onLegendItemOverAction,
  onToggleDeselectSeriesAction,
} from '../../state/actions/legend';
import { Color, LayoutDirection } from '../../utils/common';
import { deepEqual } from '../../utils/fast_deep_equal';
import { Color as ItemColor } from './color';
import { renderExtra } from './extra';
import { Label as ItemLabel } from './label';
import { getExtra } from './utils';

/** @internal */
export const LEGEND_HIERARCHY_MARGIN = 10;

/** @internal */
export interface LegendItemProps {
  item: LegendItem;
  totalItems: number;
  positionConfig: LegendPositionConfig;
  extraValues: Map<string, LegendItemExtraValues>;
  showExtra: boolean;
  colorPicker?: LegendColorPicker;
  action?: LegendAction;
  onClick?: LegendItemListener;
  onMouseOut?: BasicListener;
  onMouseOver?: LegendItemListener;
  mouseOutAction: typeof onLegendItemOutAction;
  mouseOverAction: typeof onLegendItemOverAction;
  clearTemporaryColorsAction: typeof clearTemporaryColorsAction;
  setTemporaryColorAction: typeof setTemporaryColorAction;
  setPersistedColorAction: typeof setPersistedColorAction;
  toggleDeselectSeriesAction: typeof onToggleDeselectSeriesAction;
}

interface LegendItemState {
  isOpen: boolean;
  actionActive: boolean;
}

/** @internal */
export class LegendListItem extends Component<LegendItemProps, LegendItemState> {
  static displayName = 'LegendItem';

  shouldClearPersistedColor = false;

  colorRef = createRef<HTMLButtonElement>();

  state: LegendItemState = {
    isOpen: false,
    actionActive: false,
  };

  shouldComponentUpdate(nextProps: LegendItemProps, nextState: LegendItemState) {
    return !deepEqual(this.props, nextProps) || !deepEqual(this.state, nextState);
  }

  handleColorClick = (changeable: boolean): MouseEventHandler | undefined =>
    changeable
      ? (event) => {
          event.stopPropagation();
          this.toggleIsOpen();
        }
      : undefined;

  toggleIsOpen = () => {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  };

  onLegendItemMouseOver = () => {
    const { onMouseOver, mouseOverAction, item } = this.props;
    // call the settings listener directly if available
    if (onMouseOver) {
      onMouseOver(item.seriesIdentifiers);
    }
    mouseOverAction(item.path);
  };

  onLegendItemMouseOut = () => {
    const { onMouseOut, mouseOutAction } = this.props;
    // call the settings listener directly if available
    if (onMouseOut) {
      onMouseOut();
    }
    mouseOutAction();
  };

  /**
   * Returns click function only if toggleable or click listern is provided
   */
  handleLabelClick = (legendItemId: SeriesIdentifier[]): MouseEventHandler | undefined => {
    const { item, onClick, toggleDeselectSeriesAction, totalItems } = this.props;
    if (totalItems <= 1 || (!item.isToggleable && !onClick)) {
      return;
    }

    return ({ shiftKey }) => {
      if (onClick) {
        onClick(legendItemId);
      }

      if (item.isToggleable) {
        toggleDeselectSeriesAction(legendItemId, shiftKey);
      }
    };
  };

  renderColorPicker() {
    const {
      colorPicker: ColorPicker,
      item,
      clearTemporaryColorsAction,
      setTemporaryColorAction,
      setPersistedColorAction,
    } = this.props;
    const { seriesIdentifiers, color } = item;
    const seriesKeys = seriesIdentifiers.map(({ key }) => key);
    const handleClose = () => {
      setPersistedColorAction(seriesKeys, this.shouldClearPersistedColor ? null : color);
      clearTemporaryColorsAction();
      this.toggleIsOpen();
    };
    const handleChange = (c: Color | null) => {
      this.shouldClearPersistedColor = c === null;
      setTemporaryColorAction(seriesKeys, c);
    };
    if (ColorPicker && this.state.isOpen && this.colorRef.current) {
      return (
        <ColorPicker
          anchor={this.colorRef.current}
          color={color}
          onClose={handleClose}
          onChange={handleChange}
          seriesIdentifiers={seriesIdentifiers}
        />
      );
    }
  }

  render() {
    const { extraValues, item, showExtra, colorPicker, totalItems, action: Action, positionConfig } = this.props;
    const { color, isSeriesHidden, isItemHidden, seriesIdentifiers, label } = item;

    if (isItemHidden) return null;

    const itemClassNames = classNames('echLegendItem', {
      'echLegendItem--hidden': isSeriesHidden,
      'echLegendItem--vertical': positionConfig.direction === LayoutDirection.Vertical,
    });
    const hasColorPicker = Boolean(colorPicker);
    const extra = showExtra && getExtra(extraValues, item, totalItems);
    const style = item.depth
      ? {
          marginLeft: LEGEND_HIERARCHY_MARGIN * (item.depth ?? 0),
        }
      : undefined;
    return (
      <>
        <li
          className={itemClassNames}
          onMouseEnter={this.onLegendItemMouseOver}
          onMouseLeave={this.onLegendItemMouseOut}
          style={style}
          data-ech-series-name={label}
        >
          <div className="background" />
          <ItemColor
            ref={this.colorRef}
            color={color}
            seriesName={label}
            isSeriesHidden={isSeriesHidden}
            hasColorPicker={hasColorPicker}
            onClick={this.handleColorClick(hasColorPicker)}
          />
          <ItemLabel
            label={label}
            isToggleable={totalItems > 1 && item.isToggleable}
            onClick={this.handleLabelClick(seriesIdentifiers)}
            isSeriesHidden={isSeriesHidden}
          />
          {extra && !isSeriesHidden && renderExtra(extra)}
          {Action && (
            <div className="echLegendItem__action">
              <Action series={seriesIdentifiers} color={color} label={label} />
            </div>
          )}
        </li>
        {this.renderColorPicker()}
      </>
    );
  }
}

/** @internal */
export function renderLegendItem(
  item: LegendItem,
  props: Omit<LegendItemProps, 'item'>,
  totalItems: number,
  index: number,
) {
  return <LegendListItem key={`${index}`} item={item} {...props} />;
}

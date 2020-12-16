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

import { LegendItem, LegendItemExtraValues } from '../../commons/legend';
import { SeriesIdentifier } from '../../commons/series_id';
import { LegendItemListener, BasicListener, LegendColorPicker, LegendAction } from '../../specs/settings';
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
import { Position, Color } from '../../utils/commons';
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
  position: Position;
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

/**
 * @internal
 * @param item
 * @param props
 */
export function renderLegendItem(
  item: LegendItem,
  props: Omit<LegendItemProps, 'item'>,
  totalItems: number,
  index: number,
) {
  const {
    seriesIdentifier: { key },
    childId,
  } = item;

  return (
    <LegendListItem
      key={`${key}-${childId}-${index}`}
      item={item}
      totalItems={totalItems}
      position={props.position}
      colorPicker={props.colorPicker}
      action={props.action}
      extraValues={props.extraValues}
      showExtra={props.showExtra}
      toggleDeselectSeriesAction={props.toggleDeselectSeriesAction}
      mouseOutAction={props.mouseOutAction}
      mouseOverAction={props.mouseOverAction}
      clearTemporaryColorsAction={props.clearTemporaryColorsAction}
      setTemporaryColorAction={props.setTemporaryColorAction}
      setPersistedColorAction={props.setPersistedColorAction}
      onMouseOver={props.onMouseOver}
      onMouseOut={props.onMouseOut}
      onClick={props.onClick}
    />
  );
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

  handleColorClick = (changable: boolean): MouseEventHandler | undefined =>
    changable
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
      onMouseOver(item.seriesIdentifier);
    }
    mouseOverAction(item.seriesIdentifier.key);
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
  handleLabelClick = (legendItemId: SeriesIdentifier): MouseEventHandler | undefined => {
    const { item, onClick, toggleDeselectSeriesAction } = this.props;

    if (!item.isToggleable && !onClick) {
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
    const { seriesIdentifier, color } = item;

    const handleClose = () => {
      setPersistedColorAction(seriesIdentifier.key, this.shouldClearPersistedColor ? null : color);
      clearTemporaryColorsAction();
      this.toggleIsOpen();
    };
    const handleChange = (c: Color | null) => {
      this.shouldClearPersistedColor = c === null;
      setTemporaryColorAction(seriesIdentifier.key, c);
    };
    if (ColorPicker && this.state.isOpen && this.colorRef.current) {
      return (
        <ColorPicker
          anchor={this.colorRef.current}
          color={color}
          onClose={handleClose}
          onChange={handleChange}
          seriesIdentifier={seriesIdentifier}
        />
      );
    }
  }

  render() {
    const { extraValues, item, showExtra, colorPicker, position, totalItems, action: Action } = this.props;
    const { color, isSeriesHidden, isItemHidden, seriesIdentifier, label } = item;
    const itemClassNames = classNames('echLegendItem', `echLegendItem--${position}`, {
      'echLegendItem--hidden': isSeriesHidden,
      'echLegendItem__extra--hidden': isItemHidden,
    });
    const hasColorPicker = Boolean(colorPicker);
    const extra = getExtra(extraValues, item, totalItems);
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
            isToggleable={item.isToggleable}
            onClick={this.handleLabelClick(seriesIdentifier)}
            isSeriesHidden={isSeriesHidden}
          />
          {showExtra && extra && renderExtra(extra, isSeriesHidden)}
          {Action && (
            <div className="echLegendItem__action">
              <Action series={seriesIdentifier} color={color} label={label} />
            </div>
          )}
        </li>
        {this.renderColorPicker()}
      </>
    );
  }
}

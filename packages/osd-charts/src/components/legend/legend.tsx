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
import React from 'react';
import { connect } from 'react-redux';
import { Dispatch, bindActionCreators } from 'redux';

import { LegendItem, LegendItemExtraValues } from '../../common/legend';
import { LegendItemListener, BasicListener, LegendColorPicker, LegendAction } from '../../specs';
import { clearTemporaryColors, setTemporaryColor, setPersistedColor } from '../../state/actions/colors';
import {
  onToggleDeselectSeriesAction,
  onLegendItemOutAction,
  onLegendItemOverAction,
} from '../../state/actions/legend';
import { GlobalChartState } from '../../state/chart_state';
import { getChartThemeSelector } from '../../state/selectors/get_chart_theme';
import { getInternalIsInitializedSelector, InitStatus } from '../../state/selectors/get_internal_is_intialized';
import { getLegendItemsSelector } from '../../state/selectors/get_legend_items';
import { getLegendExtraValuesSelector } from '../../state/selectors/get_legend_items_values';
import { getLegendSizeSelector } from '../../state/selectors/get_legend_size';
import { getSettingsSpecSelector } from '../../state/selectors/get_settings_specs';
import { BBox } from '../../utils/bbox/bbox_calculator';
import { Position } from '../../utils/common';
import { LIGHT_THEME } from '../../utils/themes/light_theme';
import { Theme } from '../../utils/themes/theme';
import { LegendItemProps, renderLegendItem } from './legend_item';
import { getLegendStyle, getLegendListStyle } from './style_utils';

interface LegendStateProps {
  debug: boolean;
  chartTheme: Theme;
  size: BBox;
  position: Position;
  items: LegendItem[];
  showExtra: boolean;
  extraValues: Map<string, LegendItemExtraValues>;
  colorPicker?: LegendColorPicker;
  action?: LegendAction;
  onItemOver?: LegendItemListener;
  onItemOut?: BasicListener;
  onItemClick?: LegendItemListener;
}
interface LegendDispatchProps {
  onItemOutAction: typeof onLegendItemOutAction;
  onItemOverAction: typeof onLegendItemOverAction;
  onToggleDeselectSeriesAction: typeof onToggleDeselectSeriesAction;
  clearTemporaryColors: typeof clearTemporaryColors;
  setTemporaryColor: typeof setTemporaryColor;
  setPersistedColor: typeof setPersistedColor;
}

function LegendComponent(props: LegendStateProps & LegendDispatchProps) {
  const {
    items,
    position,
    size,
    debug,
    chartTheme: { chartMargins, legend },
  } = props;
  if (items.length === 0) {
    return null;
  }
  const legendContainerStyle = getLegendStyle(position, size, legend.margin);
  const legendListStyle = getLegendListStyle(position, chartMargins, legend);
  const legendClasses = classNames('echLegend', `echLegend--${position}`, {
    'echLegend--debug': debug,
  });

  const itemProps: Omit<LegendItemProps, 'item'> = {
    position,
    totalItems: items.length,
    extraValues: props.extraValues,
    showExtra: props.showExtra,
    onMouseOut: props.onItemOut,
    onMouseOver: props.onItemOver,
    onClick: props.onItemClick,
    clearTemporaryColorsAction: props.clearTemporaryColors,
    setPersistedColorAction: props.setPersistedColor,
    setTemporaryColorAction: props.setTemporaryColor,
    mouseOutAction: props.onItemOutAction,
    mouseOverAction: props.onItemOverAction,
    toggleDeselectSeriesAction: props.onToggleDeselectSeriesAction,
    colorPicker: props.colorPicker,
    action: props.action,
  };
  return (
    <div className={legendClasses}>
      <div style={legendContainerStyle} className="echLegendListContainer">
        <ul style={legendListStyle} className="echLegendList">
          {items.map((item, index) => renderLegendItem(item, itemProps, items.length, index))}
        </ul>
      </div>
    </div>
  );
}

const mapDispatchToProps = (dispatch: Dispatch): LegendDispatchProps =>
  bindActionCreators(
    {
      onToggleDeselectSeriesAction,
      onItemOutAction: onLegendItemOutAction,
      onItemOverAction: onLegendItemOverAction,
      clearTemporaryColors,
      setTemporaryColor,
      setPersistedColor,
    },
    dispatch,
  );

const EMPTY_DEFAULT_STATE = {
  items: [],
  position: Position.Right,
  extraValues: new Map(),
  debug: false,
  chartTheme: LIGHT_THEME,
  size: { width: 0, height: 0 },
  showExtra: false,
};

const mapStateToProps = (state: GlobalChartState): LegendStateProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return EMPTY_DEFAULT_STATE;
  }
  const {
    legendPosition,
    showLegend,
    showLegendExtra,
    debug,
    legendColorPicker,
    legendAction,
    onLegendItemOver: onItemOver,
    onLegendItemOut: onItemOut,
    onLegendItemClick: onItemClick,
  } = getSettingsSpecSelector(state);
  if (!showLegend) {
    return EMPTY_DEFAULT_STATE;
  }
  return {
    debug,
    chartTheme: getChartThemeSelector(state),
    size: getLegendSizeSelector(state),
    items: getLegendItemsSelector(state),
    position: legendPosition,
    showExtra: showLegendExtra,
    extraValues: getLegendExtraValuesSelector(state),
    colorPicker: legendColorPicker,
    action: legendAction,
    onItemOver,
    onItemOut,
    onItemClick,
  };
};

/** @internal */
export const Legend = connect(mapStateToProps, mapDispatchToProps)(LegendComponent);

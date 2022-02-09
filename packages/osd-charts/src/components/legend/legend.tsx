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
import { DEFAULT_LEGEND_CONFIG, LegendSpec } from '../../specs';
import { clearTemporaryColors, setTemporaryColor, setPersistedColor } from '../../state/actions/colors';
import {
  onToggleDeselectSeriesAction,
  onLegendItemOutAction,
  onLegendItemOverAction,
} from '../../state/actions/legend';
import { GlobalChartState } from '../../state/chart_state';
import { getChartThemeSelector } from '../../state/selectors/get_chart_theme';
import { getInternalIsInitializedSelector, InitStatus } from '../../state/selectors/get_internal_is_intialized';
import { getInternalMainProjectionAreaSelector } from '../../state/selectors/get_internal_main_projection_area';
import { getInternalProjectionContainerAreaSelector } from '../../state/selectors/get_internal_projection_container_area';
import { getLegendConfigSelector } from '../../state/selectors/get_legend_config_selector';
import { getLegendItemsSelector } from '../../state/selectors/get_legend_items';
import { getLegendExtraValuesSelector } from '../../state/selectors/get_legend_items_values';
import { getLegendSizeSelector } from '../../state/selectors/get_legend_size';
import { getSettingsSpecSelector } from '../../state/selectors/get_settings_specs';
import { BBox } from '../../utils/bbox/bbox_calculator';
import { HorizontalAlignment, LayoutDirection, VerticalAlignment } from '../../utils/common';
import { Dimensions } from '../../utils/dimensions';
import { LIGHT_THEME } from '../../utils/themes/light_theme';
import { Theme } from '../../utils/themes/theme';
import { LegendItemProps, renderLegendItem } from './legend_item';
import { getLegendPositionConfig, legendPositionStyle } from './position_style';
import { getLegendStyle, getLegendListStyle } from './style_utils';

interface LegendStateProps {
  debug: boolean;
  chartDimensions: Dimensions;
  containerDimensions: Dimensions;
  chartTheme: Theme;
  size: BBox;
  config: LegendSpec;
  items: LegendItem[];
  extraValues: Map<string, LegendItemExtraValues>;
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
    size,
    debug,
    chartTheme: { chartMargins, legend },
    chartDimensions,
    containerDimensions,
    config,
  } = props;

  if (items.length === 0 || items.every(({ isItemHidden }) => isItemHidden)) {
    return null;
  }

  const positionConfig = getLegendPositionConfig(config.legendPosition);
  const containerStyle = getLegendStyle(positionConfig, size, legend.margin);
  const listStyle = getLegendListStyle(positionConfig, chartMargins, legend, items.length);

  const legendClasses = classNames('echLegend', {
    'echLegend--debug': debug,
    'echLegend--horizontal': positionConfig.direction === LayoutDirection.Horizontal,
    'echLegend--vertical': positionConfig.direction === LayoutDirection.Vertical,
    'echLegend--left': positionConfig.hAlign === HorizontalAlignment.Left,
    'echLegend--right': positionConfig.hAlign === HorizontalAlignment.Right,
    'echLegend--top': positionConfig.vAlign === VerticalAlignment.Top,
    'echLegend--bottom': positionConfig.vAlign === VerticalAlignment.Bottom,
  });

  const itemProps: Omit<LegendItemProps, 'item'> = {
    positionConfig,
    totalItems: items.length,
    extraValues: props.extraValues,
    showExtra: config.showLegendExtra,
    onMouseOut: config.onLegendItemOut,
    onMouseOver: config.onLegendItemOver,
    onClick: config.onLegendItemClick,
    clearTemporaryColorsAction: props.clearTemporaryColors,
    setPersistedColorAction: props.setPersistedColor,
    setTemporaryColorAction: props.setTemporaryColor,
    mouseOutAction: props.onItemOutAction,
    mouseOverAction: props.onItemOverAction,
    toggleDeselectSeriesAction: props.onToggleDeselectSeriesAction,
    colorPicker: config.legendColorPicker,
    action: config.legendAction,
  };
  const positionStyle = legendPositionStyle(config, size, chartDimensions, containerDimensions);
  return (
    <div className={legendClasses} style={positionStyle}>
      <div style={containerStyle} className="echLegendListContainer">
        <ul style={listStyle} className="echLegendList">
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

const EMPTY_DEFAULT_STATE: LegendStateProps = {
  chartDimensions: { width: 0, height: 0, left: 0, top: 0 },
  containerDimensions: { width: 0, height: 0, left: 0, top: 0 },
  items: [],
  extraValues: new Map(),
  debug: false,
  chartTheme: LIGHT_THEME,
  size: { width: 0, height: 0 },
  config: DEFAULT_LEGEND_CONFIG,
};

const mapStateToProps = (state: GlobalChartState): LegendStateProps => {
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return EMPTY_DEFAULT_STATE;
  }
  const config = getLegendConfigSelector(state);
  if (!config.showLegend) {
    return EMPTY_DEFAULT_STATE;
  }
  const { debug } = getSettingsSpecSelector(state);
  return {
    debug,
    chartDimensions: getInternalMainProjectionAreaSelector(state),
    containerDimensions: getInternalProjectionContainerAreaSelector(state),
    chartTheme: getChartThemeSelector(state),
    size: getLegendSizeSelector(state),
    items: getLegendItemsSelector(state),
    extraValues: getLegendExtraValuesSelector(state),
    config,
  };
};

/** @internal */
export const Legend = connect(mapStateToProps, mapDispatchToProps)(LegendComponent);

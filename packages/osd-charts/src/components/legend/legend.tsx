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
 * under the License. */

import React from 'react';
import classNames from 'classnames';
import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Position } from '../../utils/commons';
import { GlobalChartState } from '../../state/chart_state';
import { getLegendItemsSelector } from '../../state/selectors/get_legend_items';
import { getSettingsSpecSelector } from '../../state/selectors/get_settings_specs';
import { getChartThemeSelector } from '../../state/selectors/get_chart_theme';
import { getLegendExtraValuesSelector } from '../../state/selectors/get_legend_items_values';
import { getLegendSizeSelector } from '../../state/selectors/get_legend_size';
import { onToggleLegend } from '../../state/actions/legend';
import { LIGHT_THEME } from '../../utils/themes/light_theme';
import { LegendItemProps } from './legend_item';
import { Theme } from '../../utils/themes/theme';
import { LegendItem, LegendItemExtraValues } from '../../commons/legend';
import { BBox } from '../../utils/bbox/bbox_calculator';
import {
  onToggleDeselectSeriesAction,
  onLegendItemOutAction,
  onLegendItemOverAction,
} from '../../state/actions/legend';
import { clearTemporaryColors, setTemporaryColor, setPersistedColor } from '../../state/actions/colors';
import { LegendItemListener, BasicListener, LegendColorPicker } from '../../specs';
import { getLegendStyle, getLegendListStyle } from './style_utils';
import { renderLegendItem } from './legend_item';

interface LegendStateProps {
  debug: boolean;
  chartTheme: Theme;
  size: BBox;
  position: Position;
  collapsed: boolean;
  items: LegendItem[];
  showExtra: boolean;
  extraValues: Map<string, LegendItemExtraValues>;
  colorPicker?: LegendColorPicker;
  onItemOver?: LegendItemListener;
  onItemOut?: BasicListener;
  onItemClick?: LegendItemListener;
}
interface LegendDispatchProps {
  onToggle: typeof onToggleLegend;
  onItemOutAction: typeof onLegendItemOutAction;
  onItemOverAction: typeof onLegendItemOverAction;
  onToggleDeselectSeriesAction: typeof onToggleDeselectSeriesAction;
  clearTemporaryColors: typeof clearTemporaryColors;
  setTemporaryColor: typeof setTemporaryColor;
  setPersistedColor: typeof setPersistedColor;
}
type LegendProps = LegendStateProps & LegendDispatchProps;

/**
 * @internal
 */
export class LegendComponent extends React.Component<LegendProps> {
  static displayName = 'Legend';

  render() {
    const {
      items,
      position,
      size,
      debug,
      chartTheme: { chartMargins, legend },
    } = this.props;
    if (items.length === 0) {
      return null;
    }
    const legendContainerStyle = getLegendStyle(position, size);
    const legendListStyle = getLegendListStyle(position, chartMargins, legend);
    const legendClasses = classNames('echLegend', `echLegend--${position}`, {
      'echLegend--debug': debug,
    });

    const itemProps: Omit<LegendItemProps, 'item'> = {
      position,
      totalItems: items.length,
      extraValues: this.props.extraValues,
      showExtra: this.props.showExtra,
      onMouseOut: this.props.onItemOut,
      onMouseOver: this.props.onItemOver,
      onClick: this.props.onItemClick,
      clearTemporaryColorsAction: this.props.clearTemporaryColors,
      setPersistedColorAction: this.props.setPersistedColor,
      setTemporaryColorAction: this.props.setTemporaryColor,
      mouseOutAction: this.props.onItemOutAction,
      mouseOverAction: this.props.onItemOverAction,
      toggleDeselectSeriesAction: this.props.onToggleDeselectSeriesAction,
      colorPicker: this.props.colorPicker,
    };
    return (
      <div className={legendClasses}>
        <div style={legendContainerStyle} className="echLegendListContainer">
          <ul style={legendListStyle} className="echLegendList">
            {items.map((item, index) => {
              return renderLegendItem(item, itemProps, items.length, index);
            })}
          </ul>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): LegendDispatchProps =>
  bindActionCreators(
    {
      onToggle: onToggleLegend,
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
  collapsed: false,
  extraValues: new Map(),
  debug: false,
  chartTheme: LIGHT_THEME,
  size: { width: 0, height: 0 },
  showExtra: false,
};
const mapStateToProps = (state: GlobalChartState): LegendStateProps => {
  if (!state.specsInitialized) {
    return EMPTY_DEFAULT_STATE;
  }
  const {
    legendPosition,
    showLegend,
    showLegendExtra,
    debug,
    legendColorPicker,
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
    collapsed: state.interactions.legendCollapsed,
    items: getLegendItemsSelector(state),
    position: legendPosition,
    showExtra: showLegendExtra,
    extraValues: getLegendExtraValuesSelector(state),
    colorPicker: legendColorPicker,
    onItemOver,
    onItemOut,
    onItemClick,
  };
};

/** @internal */
export const Legend = connect(mapStateToProps, mapDispatchToProps)(LegendComponent);
